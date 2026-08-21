"use server";

import { db } from "@/db";
import { flashcards, decks, deckPermissions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { addCardSchema, updateCardSchema, cardLevelSchema, syncDeckCardsSchema } from "@/lib/validations";

// ============================================
// Helper: Check if user can edit deck's cards
// ============================================

async function canEditDeck(deckId: string, userId: string): Promise<boolean> {
    const deck = await db.query.decks.findFirst({
        where: eq(decks.id, deckId),
    });

    if (!deck) return false;

    if (deck.ownerId === userId) return true;

    const permission = await db.query.deckPermissions.findFirst({
        where: and(
            eq(deckPermissions.deckId, deckId),
            eq(deckPermissions.userId, userId)
        ),
    });

    return permission?.role === "editor";
}

/**
 * Fetch the card's deck and the user's permission role in a single joined query.
 * Returns null if the card (or its deck) does not exist.
 */
async function getCardEditContext(cardId: string, userId: string): Promise<{ deckId: string; canEdit: boolean } | null> {
    const [row] = await db
        .select({
            deckId: flashcards.deckId,
            ownerId: decks.ownerId,
            role: deckPermissions.role,
        })
        .from(flashcards)
        .innerJoin(decks, eq(flashcards.deckId, decks.id))
        .leftJoin(deckPermissions, and(
            eq(deckPermissions.deckId, decks.id),
            eq(deckPermissions.userId, userId)
        ))
        .where(eq(flashcards.id, cardId));

    if (!row) return null;

    return {
        deckId: row.deckId,
        canEdit: row.ownerId === userId || row.role === "editor",
    };
}

async function requireAuth(): Promise<{ id: string }> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return { id: session.user.id };
}

export async function updateCardLevel(cardId: string, level: string) {
    const user = await requireAuth();

    const levelValidation = cardLevelSchema.safeParse(level);
    if (!levelValidation.success) {
        throw new Error("Invalid card level");
    }

    const context = await getCardEditContext(cardId, user.id);

    if (!context) {
        throw new Error("Card not found");
    }

    if (!context.canEdit) {
        throw new Error("Permission denied");
    }

    await Promise.all([
        db.update(flashcards)
            .set({
                level: levelValidation.data,
                updatedAt: new Date(),
            })
            .where(eq(flashcards.id, cardId)),
        db.update(decks)
            .set({ updatedAt: new Date() })
            .where(eq(decks.id, context.deckId)),
    ]);

    revalidatePath("/");
}

// ============================================
// UPDATE: Card content
// ============================================

export async function updateCard(cardId: string, question: string, answer: string, image?: string) {
    const user = await requireAuth();

    const validation = updateCardSchema.safeParse({ question, answer });
    if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || "Invalid input");
    }

    const context = await getCardEditContext(cardId, user.id);

    if (!context) {
        throw new Error("Card not found");
    }

    if (!context.canEdit) {
        throw new Error("Permission denied");
    }

    await Promise.all([
        db.update(flashcards)
            .set({
                question: validation.data.question,
                answer: validation.data.answer,
                image: image?.trim() || null,
                updatedAt: new Date(),
            })
            .where(eq(flashcards.id, cardId)),
        db.update(decks)
            .set({ updatedAt: new Date() })
            .where(eq(decks.id, context.deckId)),
    ]);
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

    const cardsToUpdate: { id: string; question: string; answer: string; image: string | null; sortOrder: number }[] = [];
    const cardsToInsert: { deckId: string; question: string; answer: string; image: string | null; level: string; sortOrder: number }[] = [];

    for (const [index, card] of validation.data.cards.entries()) {
        const image = card.image?.trim() || null;
        const cardId = card.id;

        if (cardId && !isTempCardId(cardId) && existingIds.has(cardId)) {
            cardsToUpdate.push({ id: cardId, question: card.question, answer: card.answer, image, sortOrder: index });
        } else {
            cardsToInsert.push({ deckId, question: card.question, answer: card.answer, image, level: "Nowe", sortOrder: index });
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
                .set({
                    question: card.question,
                    answer: card.answer,
                    image: card.image,
                    sortOrder: card.sortOrder,
                    updatedAt: now,
                })
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

    const validation = addCardSchema.safeParse({ deckId, question, answer });
    if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || "Invalid input");
    }

    if (!(await canEditDeck(validation.data.deckId, user.id))) {
        throw new Error("Permission denied");
    }

    const existingCards = await db.query.flashcards.findMany({
        where: eq(flashcards.deckId, deckId),
        columns: { sortOrder: true },
    });
    const nextSortOrder = existingCards.reduce(
        (max, card) => Math.max(max, card.sortOrder ?? 0),
        -1
    ) + 1;

    const [newCard] = await db.insert(flashcards).values({
        deckId: validation.data.deckId,
        question: validation.data.question,
        answer: validation.data.answer,
        level: "Nowe",
        sortOrder: nextSortOrder,
    }).returning();

    await db.update(decks)
        .set({ updatedAt: new Date() })
        .where(eq(decks.id, validation.data.deckId));

    revalidatePath("/");
    return newCard;
}

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
