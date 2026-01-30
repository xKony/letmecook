// Card progress levels (matching Python implementation)
export type CardLevel = "Nowe" | "Nie umiem" | "W miarę" | "Umiem" | "Opanowane 100%";

// Single flashcard
export interface Flashcard {
    id: string;
    question: string;
    answer: string;
    level: CardLevel;
}

// A deck of flashcards
export interface Deck {
    id: string;
    name: string;
    cards: Flashcard[];
    createdAt: number;
    updatedAt: number;
}

// Simplified app state - no more profile abstraction
// Guest mode: decks stored directly in localStorage
// Authenticated mode: decks fetched from database
export interface GuestState {
    decks: Deck[];
}

// Rating options for buttons
export const RATINGS: { label: string; value: CardLevel; shortcut: string }[] = [
    { label: "1 - Nie umiem", value: "Nie umiem", shortcut: "1" },
    { label: "2 - W miarę", value: "W miarę", shortcut: "2" },
    { label: "3 - Umiem", value: "Umiem", shortcut: "3" },
    { label: "4 - Opanowane", value: "Opanowane 100%", shortcut: "4" },
];
