"use server";

import { db } from "@/db";
import { decks, flashcards } from "@/db/schema";
import { auth } from "@/lib/auth";
import { parseQuestionsFile } from "@/lib/storage";
import { revalidatePath } from "next/cache";

// Type for localStorage deck format
interface LocalStorageDeck {
    id: string;
    name: string;
    cards: {
        id: string;
        question: string;
        answer: string;
        level: string;
    }[];
    createdAt: number;
    updatedAt: number;
}

// Type for the full localStorage export
interface LocalStorageExport {
    decks: LocalStorageDeck[];
    exportedAt: string;
}

// ============================================
// Migration: Import decks from localStorage export
// ============================================

export async function importLocalStorageDecks(exportData: LocalStorageExport) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Must be logged in to import decks");
    }

    const userId = session.user.id;
    const importedDecks: string[] = [];

    for (const localDeck of exportData.decks) {
        try {
            // Create the deck
            const [newDeck] = await db.insert(decks).values({
                name: localDeck.name,
                ownerId: userId,
                isPublic: false,
                createdAt: new Date(localDeck.createdAt),
                updatedAt: new Date(localDeck.updatedAt),
            }).returning();

            // Create the flashcards
            if (localDeck.cards.length > 0) {
                await db.insert(flashcards).values(
                    localDeck.cards.map((card) => ({
                        deckId: newDeck.id,
                        question: card.question,
                        answer: card.answer,
                        level: card.level,
                    }))
                );
            }

            importedDecks.push(localDeck.name);
        } catch (error) {
            console.error(`Failed to import deck "${localDeck.name}":`, error);
        }
    }

    revalidatePath("/");
    return {
        success: true,
        imported: importedDecks.length,
        deckNames: importedDecks,
    };
}

// ============================================
// Migration: Import deck from file content
// ============================================

export async function importDeckFromFile(name: string, fileContent: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Must be logged in to import decks");
    }

    const parsedCards = parseQuestionsFile(fileContent);
    if (parsedCards.length === 0) {
        throw new Error("No valid cards found in file");
    }

    const [newDeck] = await db.insert(decks).values({
        name,
        ownerId: session.user.id,
        isPublic: false,
    }).returning();

    await db.insert(flashcards).values(
        parsedCards.map((card) => ({
            deckId: newDeck.id,
            question: card.question,
            answer: card.answer,
            level: "Nowe",
        }))
    );

    revalidatePath("/");
    return newDeck;
}
