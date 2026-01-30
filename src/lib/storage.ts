import { GuestState, Deck, Flashcard, CardLevel } from "./types";

const STORAGE_KEY = "letmecook_guest_state";
const LEGACY_KEY = "letmecook_app_state"; // Old profile-based storage

// Generate unique ID
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Get initial empty state
function getInitialState(): GuestState {
    return {
        decks: [],
    };
}

// Validate GuestState structure at runtime
function isValidGuestState(data: unknown): data is GuestState {
    if (typeof data !== "object" || data === null) return false;

    const obj = data as Record<string, unknown>;

    // Validate decks array
    if (!Array.isArray(obj.decks)) return false;

    return true;
}

// Migrate from legacy profile-based storage to new flat structure
function migrateLegacyStorage(): GuestState | null {
    if (typeof window === "undefined") return null;

    try {
        const legacyData = localStorage.getItem(LEGACY_KEY);
        if (!legacyData) return null;

        const parsed = JSON.parse(legacyData);

        // Check if it's the old profile-based format
        if (parsed.users && parsed.decks && typeof parsed.decks === "object") {
            // Flatten all decks from all profiles into one array
            const allDecks: Deck[] = [];
            for (const userId of Object.keys(parsed.decks)) {
                const userDecks = parsed.decks[userId];
                if (Array.isArray(userDecks)) {
                    allDecks.push(...userDecks);
                }
            }

            console.log(`Migrated ${allDecks.length} decks from legacy storage`);

            // Remove legacy storage after migration
            localStorage.removeItem(LEGACY_KEY);

            return { decks: allDecks };
        }
    } catch (e) {
        console.error("Failed to migrate legacy storage:", e);
    }

    return null;
}

// Load guest state from localStorage
export function loadGuestState(): GuestState {
    if (typeof window === "undefined") return getInitialState();

    try {
        // First, check for existing new format
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (isValidGuestState(parsed)) {
                return parsed;
            }
            console.warn("Invalid guest state structure, checking for legacy data");
        }

        // Try to migrate from legacy format
        const migrated = migrateLegacyStorage();
        if (migrated) {
            saveGuestState(migrated);
            return migrated;
        }
    } catch (e) {
        console.error("Failed to load guest state:", e);
    }

    return getInitialState();
}

// Save guest state to localStorage
export function saveGuestState(state: GuestState): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error("Failed to save guest state:", e);
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

// Reset all card levels in a deck to "Nowe"
export function resetDeckProgress(deck: Deck): Deck {
    return {
        ...deck,
        cards: deck.cards.map((card) => ({ ...card, level: "Nowe" as CardLevel })),
        updatedAt: Date.now(),
    };
}
