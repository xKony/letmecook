"use server";

import { db } from "@/db";
import { decks, flashcards, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createDeckSchema } from "@/lib/validations";
import { sanitizeImageUrl } from "@/lib/image-url";

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

export async function createPublicDeck(
    name: string,
    cards: { question: string; answer: string; image?: string }[]
) {
    const admin = await requireAdmin();

    const validation = createDeckSchema.safeParse({
        name,
        cards: cards.map((card) => ({
            question: card.question,
            answer: card.answer,
            image: sanitizeImageUrl(card.image),
        })),
    });

    if (!validation.success) {
        throw new Error(validation.error.issues[0]?.message || "Invalid input");
    }

    const [newDeck] = await db.insert(decks).values({
        name: validation.data.name,
        ownerId: admin.id,
        isPublic: true,
    }).returning();

    if (validation.data.cards.length > 0) {
        await db.insert(flashcards).values(
            validation.data.cards.map((card) => ({
                deckId: newDeck.id,
                question: card.question,
                answer: card.answer,
                image: card.image,
                level: "Nowe",
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
                }
            },
            owner: {
                columns: {
                    name: true,
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
        } : null,
        flashcards: deck.flashcards.map(card => ({
            id: card.id,
            deckId: card.deckId,
            question: card.question,
            answer: card.answer,
            image: sanitizeImageUrl(card.image) || undefined,
            level: card.level,
        })),
    }));
}

export async function toggleDeckPublic(deckId: string) {
    await requireAdmin();

    const deck = await db.query.decks.findFirst({
        where: eq(decks.id, deckId),
    });

    if (!deck) {
        throw new Error("Deck not found");
    }

    await db.update(decks)
        .set({ isPublic: !deck.isPublic })
        .where(eq(decks.id, deckId));

    revalidatePath("/");
}

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

export async function deletePublicDeck(deckId: string) {
    await requireAdmin();

    const deck = await db.query.decks.findFirst({
        where: and(
            eq(decks.id, deckId),
            eq(decks.isPublic, true),
        ),
    });

    if (!deck) {
        throw new Error("Public deck not found");
    }

    await db.delete(decks).where(eq(decks.id, deckId));

    revalidatePath("/");
    revalidatePath("/admin");
}
