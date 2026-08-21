"use server";

import { db } from "@/db";
import { flashcards, decks, deckPermissions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { addCardSchema, updateCardSchema, cardLevelSchema } from "@/lib/validations";

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

export async function updateCard(cardId: string, question: string, answer: string) {
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
                updatedAt: new Date(),
            })
            .where(eq(flashcards.id, cardId)),
        db.update(decks)
            .set({ updatedAt: new Date() })
            .where(eq(decks.id, context.deckId)),
    ]);
}

export async function addCard(deckId: string, question: string, answer: string) {
    const user = await requireAuth();

    const validation = addCardSchema.safeParse({ deckId, question, answer });
    if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || "Invalid input");
    }

    if (!(await canEditDeck(validation.data.deckId, user.id))) {
        throw new Error("Permission denied");
    }

    const [newCard] = await db.insert(flashcards).values({
        deckId: validation.data.deckId,
        question: validation.data.question,
        answer: validation.data.answer,
        level: "Nowe",
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
