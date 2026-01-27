import { AppState, Deck, Flashcard, UserProfile, CardLevel } from "./types";

const STORAGE_KEY = "letmecook_app_state";

// Generate unique ID
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get initial empty state
function getInitialState(): AppState {
    return {
        currentUserId: null,
        users: [],
        decks: {},
    };
}

// Load state from localStorage
export function loadAppState(): AppState {
    if (typeof window === "undefined") return getInitialState();

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored) as AppState;
        }
    } catch (e) {
        console.error("Failed to load app state:", e);
    }
    return getInitialState();
}

// Save state to localStorage
export function saveAppState(state: AppState): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error("Failed to save app state:", e);
    }
}

// Parse questions.txt format: "Question | Answer"
export function parseQuestionsFile(content: string): Omit<Flashcard, "id" | "level">[] {
    const lines = content.split("\n");
    const cards: Omit<Flashcard, "id" | "level">[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const parts = trimmed.split("|");
        const question = parts[0]?.trim() || "";
        const answer = parts[1]?.trim() || "";

        if (question) {
            cards.push({ question, answer });
        }
    }

    return cards;
}

// Create a new deck from parsed cards
export function createDeck(name: string, parsedCards: Omit<Flashcard, "id" | "level">[]): Deck {
    const now = Date.now();
    const cards: Flashcard[] = parsedCards.map((card) => ({
        ...card,
        id: generateId(),
        level: "Nowe" as CardLevel,
    }));

    return {
        id: generateId(),
        name,
        cards,
        createdAt: now,
        updatedAt: now,
    };
}

// Create a new user profile
export function createUser(name: string): UserProfile {
    return {
        id: generateId(),
        name,
        createdAt: Date.now(),
    };
}

// Reset all card levels in a deck to "Nowe"
export function resetDeckProgress(deck: Deck): Deck {
    return {
        ...deck,
        cards: deck.cards.map((card) => ({ ...card, level: "Nowe" as CardLevel })),
        updatedAt: Date.now(),
    };
}
