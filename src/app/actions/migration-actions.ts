"use server";

import { db } from "@/db";
import { decks, flashcards, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { parseQuestionsFile } from "@/lib/storage";
import { createDeckSchema, cardLevelSchema } from "@/lib/validations";
import { sanitizeImageUrl } from "@/lib/image-url";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface LocalStorageDeck {
    id: string;
    name: string;
    cards: {
        id: string;
        question: string;
        answer: string;
        level: string;
        image?: string;
        sortOrder?: number;
    }[];
    createdAt: number;
    updatedAt: number;
}

interface LocalStorageExport {
    decks: LocalStorageDeck[];
    exportedAt: string;
}

async function getUserDeckQuota(userId: string): Promise<{ count: number; maxDecks: number }> {
    const [dbUser, userDecks] = await Promise.all([
        db.query.users.findFirst({ where: eq(users.id, userId) }),
        db.query.decks.findMany({
            where: eq(decks.ownerId, userId),
            columns: { id: true },
        }),
    ]);

    return {
        count: userDecks.length,
        maxDecks: dbUser?.maxDecks ?? 5,
    };
}

function resolveCardLevel(level: string | undefined): string {
    const parsed = cardLevelSchema.safeParse(level);
    return parsed.success ? parsed.data : "Nowe";
}

export async function importLocalStorageDecks(exportData: LocalStorageExport) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Must be logged in to import decks");
    }

    if (!exportData?.decks || !Array.isArray(exportData.decks)) {
        throw new Error("Invalid export data");
    }

    const userId = session.user.id;
    const importedDecks: string[] = [];
    const quota = await getUserDeckQuota(userId);
    let count = quota.count;
    const maxDecks = quota.maxDecks;

    for (const localDeck of exportData.decks) {
        if (count >= maxDecks) {
            break;
        }

        const validation = createDeckSchema.safeParse({
            name: localDeck.name,
            cards: (localDeck.cards || []).map((card) => ({
                question: card.question,
                answer: card.answer ?? "",
                image: sanitizeImageUrl(card.image),
            })),
        });

        if (!validation.success) {
            console.error(`Skipping invalid deck "${localDeck.name}":`, validation.error.flatten());
            continue;
        }

        try {
            const [newDeck] = await db.insert(decks).values({
                name: validation.data.name,
                ownerId: userId,
                isPublic: false,
                createdAt: new Date(localDeck.createdAt),
                updatedAt: new Date(localDeck.updatedAt),
            }).returning();

            if (validation.data.cards.length > 0) {
                await db.insert(flashcards).values(
                    validation.data.cards.map((card, index) => ({
                        deckId: newDeck.id,
                        question: card.question,
                        answer: card.answer,
                        image: card.image,
                        level: resolveCardLevel(localDeck.cards[index]?.level),
                        sortOrder: localDeck.cards[index]?.sortOrder ?? index,
                    }))
                );
            }

            importedDecks.push(validation.data.name);
            count += 1;
        } catch (error) {
            console.error(`Failed to import deck "${localDeck.name}":`, error);
        }
    }

    revalidatePath("/");
    return {
        success: true,
        imported: importedDecks.length,
        deckNames: importedDecks,
        skippedDueToLimit: exportData.decks.length - importedDecks.length > 0 && count >= maxDecks,
    };
}

export async function importDeckFromFile(name: string, fileContent: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Must be logged in to import decks");
    }

    const { count, maxDecks } = await getUserDeckQuota(session.user.id);
    if (count >= maxDecks) {
        throw new Error(`Maximum ${maxDecks} decks reached. Contact admin for increase.`);
    }

    const parsedCards = parseQuestionsFile(fileContent);
    if (parsedCards.length === 0) {
        throw new Error("No valid cards found in file");
    }

    const validation = createDeckSchema.safeParse({
        name,
        cards: parsedCards.map((card) => ({
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
        ownerId: session.user.id,
        isPublic: false,
    }).returning();

    await db.insert(flashcards).values(
        validation.data.cards.map((card, index) => ({
            deckId: newDeck.id,
            question: card.question,
            answer: card.answer,
            image: card.image,
            level: "Nowe",
            sortOrder: index,
        }))
    );

    revalidatePath("/");
    return newDeck;
}
