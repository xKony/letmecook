import { GuestState, Deck, Flashcard, CardLevel } from "./types";
import { sanitizeImageUrl } from "./image-url";

const STORAGE_KEY = "letmecook_guest_state";
const LEGACY_KEY = "letmecook_app_state"; // Old profile-based storage
const VALID_LEVELS = new Set<CardLevel>([
    "Nowe",
    "Nie umiem",
    "W miarę",
    "Umiem",
    "Opanowane 100%",
]);

export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function getInitialState(): GuestState {
    return {
        decks: [],
    };
}

function isValidCard(card: unknown): card is Flashcard {
    if (typeof card !== "object" || card === null) return false;
    const c = card as Record<string, unknown>;
    return (
        typeof c.id === "string" &&
        typeof c.question === "string" &&
        typeof c.answer === "string" &&
        typeof c.level === "string" &&
        VALID_LEVELS.has(c.level as CardLevel) &&
        (c.image === undefined || typeof c.image === "string")
    );
}

function isValidDeck(deck: unknown): deck is Deck {
    if (typeof deck !== "object" || deck === null) return false;
    const d = deck as Record<string, unknown>;
    return (
        typeof d.id === "string" &&
        typeof d.name === "string" &&
        Array.isArray(d.cards) &&
        d.cards.every(isValidCard) &&
        typeof d.createdAt === "number" &&
        typeof d.updatedAt === "number"
    );
}

function isValidGuestState(data: unknown): data is GuestState {
    if (typeof data !== "object" || data === null) return false;
    const obj = data as Record<string, unknown>;
    return Array.isArray(obj.decks) && obj.decks.every(isValidDeck);
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

            // Salvage: valid decks from a partially corrupt payload
            if (parsed && typeof parsed === "object" && Array.isArray(parsed.decks)) {
                const validDecks = parsed.decks.filter(isValidDeck);
                if (validDecks.length > 0) {
                    console.warn("Salvaged valid decks from partially invalid guest state");
                    return { decks: validDecks };
                }
            }
            
            // Salvage: If it's just an array of decks, wrap it
            if (Array.isArray(parsed)) {
                const validDecks = parsed.filter(isValidDeck);
                if (validDecks.length > 0) {
                    console.log("Salvaged decks from array-format storage");
                    return { decks: validDecks };
                }
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

// Parse questions.txt format: "Question | Answer" or JSON array
export function parseQuestionsFile(content: string): Omit<Flashcard, "id" | "level">[] {
    // Try parsing as JSON first
    try {
        const parsed = JSON.parse(content);
        
        // Helper to extract cards from a raw JSON array
        const extractCards = (arr: unknown[]): Omit<Flashcard, "id" | "level">[] => {
            return arr.map((item) => {
                const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
                const q = row.question ?? row.Question ?? row.q ?? row.Q ?? row.front ?? row.Front ?? row.text ?? row.Text ?? row.prompt ?? row.Prompt ?? "";
                const a = row.answer ?? row.Answer ?? row.a ?? row.A ?? row.back ?? row.Back ?? row.definition ?? row.Definition ?? row.response ?? row.Response ?? "";
                const img = row.image ?? row.Image ?? row.img ?? row.Img ?? undefined;
                
                return {
                    question: String(q),
                    answer: String(a),
                    image: sanitizeImageUrl(img ? String(img) : undefined),
                };
            }).filter((card) => card.question.trim());
        };

        // 1. Direct array of cards
        if (Array.isArray(parsed)) {
            if (parsed.length > 0) {
                // If the first item has a cards array, it's an array of decks
                if (Array.isArray(parsed[0].cards)) {
                    const allCards: Omit<Flashcard, "id" | "level">[] = [];
                    for (const deck of parsed) {
                        if (Array.isArray(deck.cards)) {
                            allCards.push(...extractCards(deck.cards));
                        }
                    }
                    if (allCards.length > 0) return allCards;
                }
                
                const cards = extractCards(parsed);
                if (cards.length > 0) return cards;
            }
        }
        
        // 2. Object containing decks (e.g. backup format) or cards (e.g. single deck format)
        if (parsed && typeof parsed === "object") {
            if (Array.isArray(parsed.decks)) {
                const allCards: Omit<Flashcard, "id" | "level">[] = [];
                for (const deck of parsed.decks) {
                    if (Array.isArray(deck.cards)) {
                        allCards.push(...extractCards(deck.cards));
                    }
                }
                if (allCards.length > 0) return allCards;
            }
            if (Array.isArray(parsed.cards)) {
                const cards = extractCards(parsed.cards);
                if (cards.length > 0) return cards;
            }
        }
        
        // If it's valid JSON but parsed to nothing, fall through to legacy format
    } catch {
        // Fallback to legacy pipe-separated format
    }

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
