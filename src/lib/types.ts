// Card progress levels (matching Python implementation)
export type CardLevel = "Nowe" | "Nie umiem" | "W miarę" | "Umiem" | "Opanowane 100%";

// Single flashcard
export interface Flashcard {
    id: string;
    question: string;
    answer: string;
    imageUrl?: string; // Optional image URL for visual aids
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

// User profile (for multi-user local support)
export interface UserProfile {
    id: string;
    name: string;
    createdAt: number;
}

// App state stored in localStorage
export interface AppState {
    currentUserId: string | null;
    users: UserProfile[];
    decks: Record<string, Deck[]>; // userId -> decks
}

// Rating options for buttons
export const RATINGS: { label: string; value: CardLevel; shortcut: string }[] = [
    { label: "1 - Nie umiem", value: "Nie umiem", shortcut: "1" },
    { label: "2 - W miarę", value: "W miarę", shortcut: "2" },
    { label: "3 - Umiem", value: "Umiem", shortcut: "3" },
    { label: "4 - Opanowane", value: "Opanowane 100%", shortcut: "4" },
];
