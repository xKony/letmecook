"use server";

import { db } from "@/db";
import { decks, flashcards, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
    cards: { question: string; answer: string }[]
) {
    const admin = await requireAdmin();

    const [newDeck] = await db.insert(decks).values({
        name,
        ownerId: admin.id,
        isPublic: true, // Public decks are visible to everyone
    }).returning();

    if (cards.length > 0) {
        await db.insert(flashcards).values(
            cards.map((card) => ({
                deckId: newDeck.id,
                question: card.question,
                answer: card.answer,
                level: "Nowe",
            }))
        );
    }

    revalidatePath("/");
    return newDeck;
}

// ============================================
// Admin: Get all public decks
// ============================================

export async function getPublicDecks() {
    const publicDecks = await db.query.decks.findMany({
        where: eq(decks.isPublic, true),
        with: {
            flashcards: true,
            owner: true,
        },
    });

    return publicDecks;
}

// ============================================
// Admin: Toggle deck public status
// ============================================

export async function toggleDeckPublic(deckId: string) {
    const admin = await requireAdmin();

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
