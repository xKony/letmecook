"use server";

import { db } from "@/db";
import { flashcards, decks, deckPermissions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ============================================
// Helper: Check if user can edit deck's cards
// ============================================

async function canEditDeck(deckId: string, userId: string): Promise<boolean> {
    const deck = await db.query.decks.findFirst({
        where: eq(decks.id, deckId),
    });

    if (!deck) return false;

    // Owner can always edit
    if (deck.ownerId === userId) return true;

    // Check for editor permission
    const permission = await db.query.deckPermissions.findFirst({
        where: and(
            eq(deckPermissions.deckId, deckId),
            eq(deckPermissions.userId, userId)
        ),
    });

    return permission?.role === "editor";
}

async function requireAuth(): Promise<{ id: string }> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return { id: session.user.id };
}

// ============================================
// UPDATE: Card level (during study)
// ============================================

export async function updateCardLevel(cardId: string, level: string) {
    const user = await requireAuth();

    // Get the card to find its deck
    const card = await db.query.flashcards.findFirst({
        where: eq(flashcards.id, cardId),
    });

    if (!card) {
        throw new Error("Card not found");
    }

    // Check edit permission
    if (!(await canEditDeck(card.deckId, user.id))) {
        throw new Error("Permission denied");
    }

    await db.update(flashcards)
        .set({
            level,
            updatedAt: new Date(),
        })
        .where(eq(flashcards.id, cardId));

    // Update deck's updatedAt
    await db.update(decks)
        .set({ updatedAt: new Date() })
        .where(eq(decks.id, card.deckId));

    revalidatePath("/");
}

// ============================================
// UPDATE: Card content
// ============================================

export async function updateCard(cardId: string, question: string, answer: string) {
    const user = await requireAuth();

    const card = await db.query.flashcards.findFirst({
        where: eq(flashcards.id, cardId),
    });

    if (!card) {
        throw new Error("Card not found");
    }

    if (!(await canEditDeck(card.deckId, user.id))) {
        throw new Error("Permission denied");
    }

    await db.update(flashcards)
        .set({
            question,
            answer,
            updatedAt: new Date(),
        })
        .where(eq(flashcards.id, cardId));

    await db.update(decks)
        .set({ updatedAt: new Date() })
        .where(eq(decks.id, card.deckId));

    revalidatePath("/");
}

// ============================================
// CREATE: Add card to deck
// ============================================

export async function addCard(deckId: string, question: string, answer: string) {
    const user = await requireAuth();

    if (!(await canEditDeck(deckId, user.id))) {
        throw new Error("Permission denied");
    }

    const [newCard] = await db.insert(flashcards).values({
        deckId,
        question,
        answer,
        level: "Nowe",
    }).returning();

    await db.update(decks)
        .set({ updatedAt: new Date() })
        .where(eq(decks.id, deckId));

    revalidatePath("/");
    return newCard;
}

// ============================================
// DELETE: Remove card
// ============================================

export async function deleteCard(cardId: string) {
    const user = await requireAuth();

    const card = await db.query.flashcards.findFirst({
        where: eq(flashcards.id, cardId),
    });

    if (!card) {
        throw new Error("Card not found");
    }

    if (!(await canEditDeck(card.deckId, user.id))) {
        throw new Error("Permission denied");
    }

    await db.delete(flashcards).where(eq(flashcards.id, cardId));

    await db.update(decks)
        .set({ updatedAt: new Date() })
        .where(eq(decks.id, card.deckId));

    revalidatePath("/");
}

// ============================================
// Batch reset deck progress
// ============================================

export async function resetDeckProgress(deckId: string) {
    const user = await requireAuth();

    if (!(await canEditDeck(deckId, user.id))) {
        throw new Error("Permission denied");
    }

    await db.update(flashcards)
        .set({
            level: "Nowe",
            updatedAt: new Date(),
        })
        .where(eq(flashcards.deckId, deckId));

    await db.update(decks)
        .set({ updatedAt: new Date() })
        .where(eq(decks.id, deckId));

    revalidatePath("/");
}
