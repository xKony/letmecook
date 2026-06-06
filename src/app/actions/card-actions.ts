"use server";

import { db } from "@/db";
import { flashcards, decks, deckPermissions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { syncDeckCardsSchema } from "@/lib/validations";

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
}

// ============================================
// UPDATE: Card content
// ============================================

export async function updateCard(cardId: string, question: string, answer: string, image?: string) {
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
            image: image || null,
            updatedAt: new Date(),
        })
        .where(eq(flashcards.id, cardId));

    await db.update(decks)
        .set({ updatedAt: new Date() })
        .where(eq(decks.id, card.deckId));
}

function isTempCardId(id: string): boolean {
    return id.startsWith("temp-");
}

// ============================================
// SYNC: Bulk update deck cards (editor)
// ============================================

export async function syncDeckCards(
    deckId: string,
    cards: { id: string; question: string; answer: string; image?: string; level?: string }[]
) {
    const user = await requireAuth();

    const validation = syncDeckCardsSchema.safeParse({ deckId, cards });
    if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || "Invalid input");
    }

    if (!(await canEditDeck(deckId, user.id))) {
        throw new Error("Permission denied");
    }

    const existingCards = await db.query.flashcards.findMany({
        where: eq(flashcards.deckId, deckId),
    });
    const existingIds = new Set(existingCards.map((c) => c.id));
    const payloadIds = new Set(
        validation.data.cards
            .map((c) => c.id)
            .filter((id): id is string => !!id && !isTempCardId(id))
    );

    const idsToDelete = [...existingIds].filter((id) => !payloadIds.has(id));
    const now = new Date();

    const cardsToUpdate: { id: string; question: string; answer: string; image: string | null }[] = [];
    const cardsToInsert: { deckId: string; question: string; answer: string; image: string | null; level: string }[] = [];

    for (const card of validation.data.cards) {
        const image = card.image?.trim() || null;
        const cardId = card.id;

        if (cardId && !isTempCardId(cardId) && existingIds.has(cardId)) {
            cardsToUpdate.push({ id: cardId, question: card.question, answer: card.answer, image });
        } else {
            cardsToInsert.push({ deckId, question: card.question, answer: card.answer, image, level: "Nowe" });
        }
    }

    type BatchQuery = Parameters<typeof db.batch>[0][number];
    const operations: BatchQuery[] = [];

    if (idsToDelete.length > 0) {
        operations.push(
            db.delete(flashcards).where(
                and(eq(flashcards.deckId, deckId), inArray(flashcards.id, idsToDelete))
            )
        );
    }

    if (cardsToInsert.length > 0) {
        operations.push(db.insert(flashcards).values(cardsToInsert));
    }

    for (const card of cardsToUpdate) {
        operations.push(
            db.update(flashcards)
                .set({ question: card.question, answer: card.answer, image: card.image, updatedAt: now })
                .where(eq(flashcards.id, card.id))
        );
    }

    operations.push(
        db.update(decks).set({ updatedAt: now }).where(eq(decks.id, deckId))
    );

    if (operations.length === 1) {
        await operations[0];
    } else {
        await db.batch(operations as [BatchQuery, ...BatchQuery[]]);
    }

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
