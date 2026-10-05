// Card progress levels (matching Python implementation)
export type CardLevel = "Nowe" | "Nie umiem" | "W miarę" | "Umiem" | "Opanowane 100%";

// Parsed/imported card before persistence
export type ParsedFlashcard = {
    question: string;
    answer: string;
    image?: string;
    occlusion?: OcclusionData | null;
};

// Image occlusion (Anki-style "image occlusion" cards).
// One source image + N masks = N cards; each card hides a different mask
// and gets its own FSRS schedule. Coordinates are fractions (0..1) of the
// image dimensions so masks scale at any render size.
export interface OcclusionMask {
    id: string;
    /** Left edge as a fraction of image width (0..1). */
    x: number;
    /** Top edge as a fraction of image height (0..1). */
    y: number;
    /** Width as a fraction of image width (0..1, exclusive). */
    w: number;
    /** Height as a fraction of image height (0..1, exclusive). */
    h: number;
    /** Optional prompt shown for this mask ("What is this statistic?"). */
    label?: string;
}

export interface OcclusionData {
    /**
     * Server-stored image (auth mode): row in `deck_images`, resolved via
     * `/api/images/[id]`. Keeps deck payloads small and dedupes identical
     * images (SHA-256) so "1 image = N cards" costs one row.
     */
    imageId?: string;
    /** Inline image (guest mode + JSON export): `data:image/...` URL. */
    imageDataUrl?: string;
    /** All masks on the shared image (siblings stay covered during review). */
    masks: OcclusionMask[];
    /** The mask this card asks about. */
    activeMaskId: string;
    /** Source image dimensions (aspect-ratio placeholder, no layout shift). */
    width?: number;
    height?: number;
}

// Single flashcard
export interface Flashcard {
    id: string;
    question: string;
    answer: string;
    image?: string;
    /** Image-occlusion payload. Absent = regular text card. */
    occlusion?: OcclusionData | null;
    level: CardLevel;
    /** Stable import order (0-based). */
    sortOrder: number;
    // --- FSRS memory state (ts-fsrs). Undefined/null = new card. ---
    /** Due timestamp (ms epoch). */
    fsrsDue?: number | null;
    /** FSRS stability (S). */
    fsrsStability?: number | null;
    /** FSRS difficulty (D, 1-10). */
    fsrsDifficulty?: number | null;
    /** Successful recalls. */
    fsrsReps?: number | null;
    /** "Again" count. */
    fsrsLapses?: number | null;
    /** 0 New, 1 Learning, 2 Review, 3 Relearning. */
    fsrsState?: number | null;
    /** Intraday learning-step progress (must round-trip for graduation). */
    fsrsLearningSteps?: number | null;
    /** Last review timestamp (ms epoch). */
    fsrsLastReview?: number | null;
    /** Last scheduled interval in days. */
    fsrsScheduledDays?: number | null;
}

// A deck of flashcards
export interface Deck {
    id: string;
    name: string;
    cards: Flashcard[];
    createdAt: number;
    updatedAt: number;
}

// Card payload for creating/saving decks (editor + import)
export interface DeckCardInput {
    question: string;
    answer: string;
    image?: string;
    occlusion?: OcclusionData | null;
}

// Card payload for deck set editor (import preview / bulk edit)
export interface EditableCard extends DeckCardInput {
    id: string;
    level?: CardLevel;
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
