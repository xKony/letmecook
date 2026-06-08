"use server";

import { db } from "@/db";
import { decks, flashcards, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cardSchema, LIMITS } from "@/lib/validations";

const replacePublicDeckCardsSchema = z.object({
    deckId: z.string().uuid("Invalid deck ID"),
    cards: z
        .array(cardSchema)
        .min(1, "At least one card is required")
        .max(LIMITS.CARDS_PER_DECK_MAX, `Maximum ${LIMITS.CARDS_PER_DECK_MAX} cards per deck`),
});

// ============================================
// Helper: Require admin access
// ============================================

async function requireAdmin() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
    });

    if (!user?.isAdmin) {
        throw new Error("Admin access required");
    }

    return user;
}

// ============================================
// Admin: Create public deck
// ============================================

export async function createPublicDeck(
    name: string,
    cards: { question: string; answer: string; image?: string }[]
) {
    const admin = await requireAdmin();

    const [newDeck] = await db.insert(decks).values({
        name,
        ownerId: admin.id,
        isPublic: true, // Public decks are visible to everyone
    }).returning();

    if (cards.length > 0) {
        await db.insert(flashcards).values(
            cards.map((card, index) => ({
                deckId: newDeck.id,
                question: card.question,
                answer: card.answer,
                image: card.image,
                level: "Nowe",
                sortOrder: index,
            }))
        );
    }

    revalidatePath("/");
    return {
        id: newDeck.id,
        name: newDeck.name,
        isPublic: newDeck.isPublic,
    };
}

// ============================================
// Admin: Get all public decks
// ============================================

export async function getPublicDecks() {
    const publicDecks = await db.query.decks.findMany({
        where: eq(decks.isPublic, true),
        with: {
            flashcards: {
                columns: {
                    id: true,
                    deckId: true,
                    question: true,
                    answer: true,
                    image: true,
                    level: true,
                    sortOrder: true,
                },
                orderBy: [asc(flashcards.sortOrder), asc(flashcards.createdAt)],
            },
            owner: {
                columns: {
                    name: true,
                    email: true,
                }
            },
        },
    });

    return publicDecks.map(deck => ({
        id: deck.id,
        name: deck.name,
        isPublic: deck.isPublic,
        owner: deck.owner ? {
            name: deck.owner.name,
            email: deck.owner.email,
        } : null,
        flashcards: deck.flashcards.map(card => ({
            id: card.id,
            deckId: card.deckId,
            question: card.question,
            answer: card.answer,
            image: card.image || undefined,
            level: card.level,
        })),
    }));
}

// ============================================
// Admin: Toggle deck public status
// ============================================

export async function toggleDeckPublic(deckId: string) {
    await requireAdmin();

    const deck = await db.query.decks.findFirst({
        where: eq(decks.id, deckId),
    });

    if (!deck) {
        throw new Error("Deck not found");
    }

    // Only admin can toggle public status, even for decks they don't own
    await db.update(decks)
        .set({ isPublic: !deck.isPublic })
        .where(eq(decks.id, deckId));

    revalidatePath("/");
}

// ============================================
// Check if current user is admin
// ============================================

export async function checkIsAdmin(): Promise<boolean> {
    const session = await auth();
    if (!session?.user?.id) {
        return false;
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
    });

    return user?.isAdmin ?? false;
}

// ============================================
// Admin: Get all users
// ============================================

export async function getAllUsers() {
    await requireAdmin();

    const allUsers = await db.query.users.findMany({
        with: {
            decks: {
                columns: {
                    id: true,
                }
            },
        },
    });

    return allUsers.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        maxDecks: user.maxDecks,
        deckCount: user.decks.length,
        createdAt: user.createdAt.toISOString(),
    }));
}

// ============================================
// Admin: Update user's max decks
// ============================================

export async function updateUserMaxDecks(userId: string, maxDecks: number) {
    await requireAdmin();

    if (maxDecks < 1 || maxDecks > 100) {
        throw new Error("Max decks must be between 1 and 100");
    }

    await db.update(users)
        .set({ maxDecks })
        .where(eq(users.id, userId));

    revalidatePath("/admin");
}

// ============================================
// Admin: Replace public deck cards in-place
// ============================================

export async function replacePublicDeckFromPersonalDeck(
    publicDeckId: string,
    sourceDeckId: string
) {
    const admin = await requireAdmin();

    const [publicDeck, sourceDeck] = await Promise.all([
        db.query.decks.findFirst({
            where: eq(decks.id, publicDeckId),
            with: {
                flashcards: {
                    orderBy: [asc(flashcards.sortOrder), asc(flashcards.createdAt)],
                },
            },
        }),
        db.query.decks.findFirst({
            where: eq(decks.id, sourceDeckId),
            with: {
                flashcards: {
                    orderBy: [asc(flashcards.sortOrder), asc(flashcards.createdAt)],
                },
            },
        }),
    ]);

    if (!publicDeck) {
        throw new Error("Public deck not found");
    }

    if (!publicDeck.isPublic) {
        throw new Error("Target deck is not in the public library");
    }

    if (!sourceDeck) {
        throw new Error("Source deck not found");
    }

    if (sourceDeck.ownerId !== admin.id) {
        throw new Error("You can only use your own decks as the source");
    }

    if (sourceDeck.isPublic) {
        throw new Error("Use a personal deck from your dashboard as the source");
    }

    if (sourceDeck.flashcards.length === 0) {
        throw new Error("Source deck has no cards");
    }

    const cards = sourceDeck.flashcards.map((card) => ({
        question: card.question,
        answer: card.answer,
        image: card.image || undefined,
    }));

    const validation = replacePublicDeckCardsSchema.safeParse({
        deckId: publicDeckId,
        cards,
    });
    if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || "Invalid input");
    }

    const normalizedCards = validation.data.cards.map((card, index) => ({
        deckId: publicDeckId,
        question: card.question,
        answer: card.answer,
        image: card.image?.trim() || null,
        level: "Nowe",
        sortOrder: index,
    }));

    await db.delete(flashcards).where(eq(flashcards.deckId, publicDeckId));
    await db.insert(flashcards).values(normalizedCards);
    await db.update(decks).set({ updatedAt: new Date() }).where(eq(decks.id, publicDeckId));

    revalidatePath("/");
    revalidatePath("/admin");

    return {
        publicDeckName: publicDeck.name,
        sourceDeckName: sourceDeck.name,
        cardCount: normalizedCards.length,
    };
}

// ============================================
// Admin: Delete public deck
// ============================================

export async function deletePublicDeck(deckId: string) {
    await requireAdmin();

    await db.delete(decks).where(eq(decks.id, deckId));

    revalidatePath("/");
    revalidatePath("/admin");
}

