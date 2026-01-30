import { AppState, Deck, Flashcard, UserProfile, CardLevel } from "./types";

const STORAGE_KEY = "letmecook_app_state";

// Generate unique ID
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Get initial empty state
function getInitialState(): AppState {
    return {
        currentUserId: null,
        users: [],
        decks: {},
    };
}

// Validate AppState structure at runtime to protect against malformed data
function isValidAppState(data: unknown): data is AppState {
    if (typeof data !== "object" || data === null) return false;

    const obj = data as Record<string, unknown>;

    // Validate currentUserId
    if (obj.currentUserId !== null && typeof obj.currentUserId !== "string") {
        return false;
    }

    // Validate users array
    if (!Array.isArray(obj.users)) return false;
    for (const user of obj.users) {
        if (typeof user !== "object" || user === null) return false;
        const u = user as Record<string, unknown>;
        if (typeof u.id !== "string" || typeof u.name !== "string" || typeof u.createdAt !== "number") {
            return false;
        }
    }

    // Validate decks record
    if (typeof obj.decks !== "object" || obj.decks === null) return false;

    return true;
}

// Load state from localStorage
export function loadAppState(): AppState {
    if (typeof window === "undefined") return getInitialState();

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (isValidAppState(parsed)) {
                return parsed;
            }
            console.warn("Invalid app state structure, resetting to defaults");
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
        const answer = parts.slice(1).join("|").trim(); // Join remaining parts as answer

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
