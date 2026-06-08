import { GuestState, Deck, Flashcard, CardLevel, ParsedFlashcard } from "./types";
import { normalizeDeckCards } from "./flashcard-order";

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
                return {
                    decks: parsed.decks.map((deck) => ({
                        ...deck,
                        cards: normalizeDeckCards(deck.cards),
                    })),
                };
            }
            
            // Salvage: If it's just an array of decks, wrap it
            if (Array.isArray(parsed)) {
                console.log("Salvaged decks from array-format storage");
                return {
                    decks: parsed.map((deck: Deck) => ({
                        ...deck,
                        cards: normalizeDeckCards(deck.cards),
                    })),
                };
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
export function parseQuestionsFile(content: string): ParsedFlashcard[] {
    // Try parsing as JSON first
    try {
        const parsed = JSON.parse(content);
        
        // Helper to extract cards from a raw JSON array
        const extractCards = (arr: unknown[]): ParsedFlashcard[] => {
            return arr.map((val) => {
                const item = val as Record<string, unknown>;
                // Support multiple key mappings case-insensitively
                const q = item.question ?? item.Question ?? item.q ?? item.Q ?? item.front ?? item.Front ?? item.text ?? item.Text ?? item.prompt ?? item.Prompt ?? "";
                const a = item.answer ?? item.Answer ?? item.a ?? item.A ?? item.back ?? item.Back ?? item.definition ?? item.Definition ?? item.response ?? item.Response ?? "";
                const img = item.image ?? item.Image ?? item.img ?? item.Img ?? undefined;
                
                return {
                    question: String(q),
                    answer: String(a),
                    image: img ? String(img) : undefined,
                };
            }).filter((card) => card.question.trim());
        };

        // 1. Direct array of cards
        if (Array.isArray(parsed)) {
            if (parsed.length > 0) {
                // If the first item has a cards array, it's an array of decks
                if (Array.isArray(parsed[0].cards)) {
                    const allCards: ParsedFlashcard[] = [];
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
                const allCards: ParsedFlashcard[] = [];
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
    const cards: ParsedFlashcard[] = [];

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
export function createDeck(name: string, parsedCards: ParsedFlashcard[]): Deck {
    const now = Date.now();
    const cards: Flashcard[] = parsedCards.map((card, index) => ({
        ...card,
        id: generateId(),
        level: "Nowe" as CardLevel,
        sortOrder: index,
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
