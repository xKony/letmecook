import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Deck, CardLevel } from "@/lib/types";

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
        level: string;
    }[];
}): Deck {
    return {
        id: dbDeck.id,
        name: dbDeck.name,
        createdAt: dbDeck.createdAt.getTime(),
        updatedAt: dbDeck.updatedAt.getTime(),
        cards: dbDeck.flashcards.map((card) => ({
            id: card.id,
            question: card.question,
            answer: card.answer,
            level: card.level as CardLevel,
        })),
    };
}
