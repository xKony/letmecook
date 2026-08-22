"use server";

import { db } from "@/db";
import { decks, flashcards, deckPermissions, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createDeckSchema, updateDeckSchema } from "@/lib/validations";
import { cache } from "react";

// ============================================
// Helper: Get current user or throw
// ============================================

const requireAuth = cache(async function (): Promise<{ id: string; email: string; name?: string | null }> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return {
        id: session.user.id,
        email: session.user.email || "",
        name: session.user.name,
    };
});

// ============================================
// Helper: Check deck access
// ============================================

type AccessLevel = "owner" | "editor" | "viewer" | null;

const getDeckAccess = cache(async function (deckId: string, userId: string | undefined): Promise<{ deck: typeof decks.$inferSelect | null; access: AccessLevel }> {
    const deck = await db.query.decks.findFirst({
        where: eq(decks.id, deckId),
    });

    if (!deck) {
        return { deck: null, access: null };
    }

    // Check if owner
    if (userId && deck.ownerId === userId) {
        return { deck, access: "owner" };
    }

    // Check if has permission
    if (userId) {
        const permission = await db.query.deckPermissions.findFirst({
            where: and(
                eq(deckPermissions.deckId, deckId),
                eq(deckPermissions.userId, userId)
            ),
        });

        if (permission) {
            return { deck, access: permission.role };
        }
    }

    // Check if public
    if (deck.isPublic) {
        return { deck, access: "viewer" };
    }

    return { deck: null, access: null };
});

/**
 * READ: Get user's decks
 * @returns Sorted array of decks with flashcards
 */
export const getMyDecks = cache(async function () {
    const user = await requireAuth();

    const userDecks = await db.query.decks.findMany({
        where: and(
            eq(decks.ownerId, user.id),
            eq(decks.isPublic, false)
        ),
        with: {
            flashcards: {
                orderBy: [asc(flashcards.sortOrder), asc(flashcards.createdAt)],
            },
        },
    });

    // Sort by updatedAt in memory (simpler than typed orderBy)
    type DeckWithCards = typeof userDecks[number];
    return userDecks.sort((a: DeckWithCards, b: DeckWithCards) => b.updatedAt.getTime() - a.updatedAt.getTime());
});

/**
 * READ: Get user's max decks limit
 * @returns Maximum number of decks the user can own
 */
export const getUserMaxDecks = cache(async function (): Promise<number> {
    const user = await requireAuth();

    const dbUser = await db.query.users.findFirst({
        where: eq(users.id, user.id),
    });

    return dbUser?.maxDecks ?? 5;
});

/**
 * CREATE: New deck
 * @param name Deck name
 * @param cards Array of questions and answers
 * @returns The created deck
 */
export async function createDeck(name: string, cards: { question: string; answer: string }[]) {
    console.log(`[CREATE_DECK] Starting creation for deck: "${name}" with ${cards.length} cards`);
    const user = await requireAuth();

    // Validate input
    const validation = createDeckSchema.safeParse({ name, cards });
    if (!validation.success) {
        console.error("[CREATE_DECK] Validation failed:", validation.error.flatten());
        throw new Error(validation.error.issues[0]?.message || "Invalid input");
    }

    // Check deck limit for this user
    const dbUser = await db.query.users.findFirst({
        where: eq(users.id, user.id),
    });
    const userDecks = await db.query.decks.findMany({
        where: eq(decks.ownerId, user.id),
    });
    const maxDecks = dbUser?.maxDecks ?? 5;
    if (userDecks.length >= maxDecks) {
        throw new Error(`Maximum ${maxDecks} decks reached. Contact admin for increase.`);
    }

    try {
        console.log("[CREATE_DECK] Transaction started (Manual Mode)");

        // 1. Create Deck
        const [deck] = await db.insert(decks).values({
            name: validation.data.name,
            ownerId: user.id,
            isPublic: false,
        }).returning();

        console.log(`[CREATE_DECK] Deck inserted with ID: ${deck.id}`);

        try {
            // 2. Insert Flashcards
            if (validation.data.cards.length > 0) {
                await db.insert(flashcards).values(
                    validation.data.cards.map((card, index) => ({
                        deckId: deck.id,
                        question: card.question,
                        answer: card.answer,
                        image: card.image,
                        level: "Nowe",
                        sortOrder: index,
                    }))
                );
                console.log(`[CREATE_DECK] Inserted ${validation.data.cards.length} flashcards`);
            }
        } catch (insertError) {
            console.error("[CREATE_DECK] Flashcard insertion failed, rolling back deck...", insertError);
            // Manual Rollback: Delete the deck we just created
            await db.delete(decks).where(eq(decks.id, deck.id));
            console.log("[CREATE_DECK] Rollback successful: Deck deleted.");
            throw insertError; // Re-throw to be caught by outer block
        }

        console.log("[CREATE_DECK] Creation process completed successfully");
        revalidatePath("/");
        return deck;
    } catch (error) {
        console.error("[CREATE_DECK] Creation failed:", error);
        // Throw a user-friendly error but log the raw one
        throw new Error("Failed to create deck. Please try again or check your connection.");
    }
}

/**
 * UPDATE: Deck metadata
 * @param deckId UUID of the deck
 * @param data Name and/or public visibility status
 */
export async function updateDeck(deckId: string, data: { name?: string; isPublic?: boolean }) {
    const user = await requireAuth();
    const { access } = await getDeckAccess(deckId, user.id);

    if (access !== "owner" && access !== "editor") {
        throw new Error("Permission denied");
    }

    const validation = updateDeckSchema.safeParse(data);
    if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || "Invalid input");
    }

    // Only owner can change visibility
    if (validation.data.isPublic !== undefined && access !== "owner") {
        throw new Error("Only owner can change visibility");
    }

    await db.update(decks)
        .set({
            ...validation.data,
            updatedAt: new Date(),
        })
        .where(eq(decks.id, deckId));

    revalidatePath("/");
}

/**
 * DELETE: Deck
 * @param deckId UUID of the deck
 */
export async function deleteDeck(deckId: string) {
    const user = await requireAuth();
    const { access } = await getDeckAccess(deckId, user.id);

    if (access !== "owner") {
        throw new Error("Only owner can delete deck");
    }

    await db.delete(decks).where(eq(decks.id, deckId));
    revalidatePath("/");
}
