"use server";

import { db } from "@/db";
import { decks, flashcards, deckPermissions, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createDeckSchema, updateDeckSchema } from "@/lib/validations";

// ============================================
// Helper: Get current user or throw
// ============================================

async function requireAuth(): Promise<{ id: string; email: string; name?: string | null }> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return {
        id: session.user.id,
        email: session.user.email || "",
        name: session.user.name,
    };
}

// ============================================
// Helper: Check deck access
// ============================================

type AccessLevel = "owner" | "editor" | "viewer" | null;

async function getDeckAccess(deckId: string, userId: string | undefined): Promise<{ deck: typeof decks.$inferSelect | null; access: AccessLevel }> {
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
}

// ============================================
// READ: Get user's decks
// ============================================

export async function getMyDecks() {
    const user = await requireAuth();

    const userDecks = await db.query.decks.findMany({
        where: eq(decks.ownerId, user.id),
        with: {
            flashcards: true,
        },
    });

    // Sort by updatedAt in memory (simpler than typed orderBy)
    type DeckWithCards = typeof userDecks[number];
    return userDecks.sort((a: DeckWithCards, b: DeckWithCards) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

// ============================================
// READ: Get single deck with cards
// ============================================

export async function getDeck(deckId: string, shareToken?: string) {
    const session = await auth();
    const userId = session?.user?.id;

    // Check for share token access
    if (shareToken) {
        const deck = await db.query.decks.findFirst({
            where: eq(decks.shareToken, shareToken),
            with: { flashcards: true },
        });
        if (deck) {
            return { deck, access: "viewer" as AccessLevel };
        }
    }

    const { deck, access } = await getDeckAccess(deckId, userId);

    if (!deck || !access) {
        return null;
    }

    const deckWithCards = await db.query.decks.findFirst({
        where: eq(decks.id, deckId),
        with: { flashcards: true },
    });

    return { deck: deckWithCards, access };
}

// ============================================
// READ: Get shared decks (where user has permission)
// ============================================

export async function getSharedDecks() {
    const user = await requireAuth();

    const permissions = await db.query.deckPermissions.findMany({
        where: eq(deckPermissions.userId, user.id),
        with: {
            deck: {
                with: { flashcards: true },
            },
        },
    });

    return permissions.map((p: typeof permissions[number]) => ({
        ...p.deck,
        role: p.role,
    }));
}

// ============================================
// CREATE: New deck
// ============================================

// ============================================
// CREATE: New deck
// ============================================

export async function createDeck(name: string, cards: { question: string; answer: string }[]) {
    console.log(`[CREATE_DECK] Starting creation for deck: "${name}" with ${cards.length} cards`);
    const user = await requireAuth();

    // Validate input
    const validation = createDeckSchema.safeParse({ name, cards });
    if (!validation.success) {
        console.error("[CREATE_DECK] Validation failed:", validation.error.flatten());
        throw new Error(validation.error.issues[0]?.message || "Invalid input");
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
                    validation.data.cards.map((card) => ({
                        deckId: deck.id,
                        question: card.question,
                        answer: card.answer,
                        level: "Nowe",
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

// ============================================
// UPDATE: Deck metadata
// ============================================

export async function updateDeck(deckId: string, data: { name?: string; isPublic?: boolean }) {
    const user = await requireAuth();
    const { access } = await getDeckAccess(deckId, user.id);

    if (access !== "owner" && access !== "editor") {
        throw new Error("Permission denied");
    }

    // Only owner can change visibility
    if (data.isPublic !== undefined && access !== "owner") {
        throw new Error("Only owner can change visibility");
    }

    await db.update(decks)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(eq(decks.id, deckId));

    revalidatePath("/");
}

// ============================================
// DELETE: Deck
// ============================================

export async function deleteDeck(deckId: string) {
    const user = await requireAuth();
    const { access } = await getDeckAccess(deckId, user.id);

    if (access !== "owner") {
        throw new Error("Only owner can delete deck");
    }

    await db.delete(decks).where(eq(decks.id, deckId));
    revalidatePath("/");
}

// ============================================
// SHARING: Generate share link
// ============================================

export async function generateShareLink(deckId: string) {
    const user = await requireAuth();
    const { deck, access } = await getDeckAccess(deckId, user.id);

    if (access !== "owner") {
        throw new Error("Only owner can generate share link");
    }

    // Generate new token or return existing
    if (deck?.shareToken) {
        return deck.shareToken;
    }

    const token = randomBytes(16).toString("hex");

    await db.update(decks)
        .set({ shareToken: token })
        .where(eq(decks.id, deckId));

    revalidatePath("/");
    return token;
}

// ============================================
// SHARING: Add user permission
// ============================================

export async function addDeckPermission(deckId: string, email: string, role: "viewer" | "editor") {
    const user = await requireAuth();
    const { access } = await getDeckAccess(deckId, user.id);

    if (access !== "owner") {
        throw new Error("Only owner can manage permissions");
    }

    // Find user by email
    const targetUser = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (!targetUser) {
        throw new Error("User not found");
    }

    // Check if permission already exists
    const existing = await db.query.deckPermissions.findFirst({
        where: and(
            eq(deckPermissions.deckId, deckId),
            eq(deckPermissions.userId, targetUser.id)
        ),
    });

    if (existing) {
        // Update existing permission
        await db.update(deckPermissions)
            .set({ role })
            .where(eq(deckPermissions.id, existing.id));
    } else {
        // Create new permission
        await db.insert(deckPermissions).values({
            deckId,
            userId: targetUser.id,
            role,
        });
    }

    revalidatePath("/");
}

// ============================================
// SHARING: Remove user permission
// ============================================

export async function removeDeckPermission(deckId: string, targetUserId: string) {
    const user = await requireAuth();
    const { access } = await getDeckAccess(deckId, user.id);

    if (access !== "owner") {
        throw new Error("Only owner can manage permissions");
    }

    await db.delete(deckPermissions)
        .where(and(
            eq(deckPermissions.deckId, deckId),
            eq(deckPermissions.userId, targetUserId)
        ));

    revalidatePath("/");
}
