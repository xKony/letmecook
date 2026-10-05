import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Deck, CardLevel } from "@/lib/types";
import { backfillLegacySortOrder, sortFlashcardsByOrder } from "@/lib/flashcard-order";
import { parseOcclusionJson } from "@/lib/occlusion";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isDesktopViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(min-width: 768px)").matches;
}

// Helper to transform DB deck to local Deck type
export function transformDbDeck(dbDeck: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    flashcards: {
        id: string;
        question: string;
        answer: string;
        image?: string | null;
        occlusion?: string | null;
        level: string;
        sortOrder?: number;
        fsrsDue?: number | null;
        fsrsStability?: number | null;
        fsrsDifficulty?: number | null;
        fsrsReps?: number | null;
        fsrsLapses?: number | null;
        fsrsState?: number | null;
        fsrsLearningSteps?: number | null;
        fsrsLastReview?: number | null;
        fsrsScheduledDays?: number | null;
        createdAt: Date;
    }[];
}): Deck {
    const orderedCards = sortFlashcardsByOrder(
        backfillLegacySortOrder(dbDeck.flashcards)
    );

    return {
        id: dbDeck.id,
        name: dbDeck.name,
        createdAt: dbDeck.createdAt.getTime(),
        updatedAt: dbDeck.updatedAt.getTime(),
        cards: orderedCards.map((card) => ({
            id: card.id,
            question: card.question,
            answer: card.answer,
            image: card.image || undefined,
            occlusion: parseOcclusionJson(card.occlusion) ?? undefined,
            level: card.level as CardLevel,
            sortOrder: card.sortOrder,
            fsrsDue: card.fsrsDue ?? undefined,
            fsrsStability: card.fsrsStability ?? undefined,
            fsrsDifficulty: card.fsrsDifficulty ?? undefined,
            fsrsReps: card.fsrsReps ?? undefined,
            fsrsLapses: card.fsrsLapses ?? undefined,
            fsrsState: card.fsrsState ?? undefined,
            fsrsLearningSteps: card.fsrsLearningSteps ?? undefined,
            fsrsLastReview: card.fsrsLastReview ?? undefined,
            fsrsScheduledDays: card.fsrsScheduledDays ?? undefined,
        })),
    };
}
