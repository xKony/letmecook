import { z } from "zod";

// ============================================
// Deck/Card Validation Schemas
// ============================================

// Limits to prevent abuse
export const LIMITS = {
    DECK_NAME_MAX: 100,
    CARDS_PER_DECK_MAX: 500,
    QUESTION_MAX: 5000,
    ANSWER_MAX: 10000,
} as const;

// Single card schema
export const cardSchema = z.object({
    question: z
        .string()
        .min(1, "Question is required")
        .max(LIMITS.QUESTION_MAX, `Question must be ${LIMITS.QUESTION_MAX} characters or less`),
    answer: z
        .string()
        .min(1, "Answer is required")
        .max(LIMITS.ANSWER_MAX, `Answer must be ${LIMITS.ANSWER_MAX} characters or less`),
});

// Deck creation schema
export const createDeckSchema = z.object({
    name: z
        .string()
        .min(1, "Deck name is required")
        .max(LIMITS.DECK_NAME_MAX, `Deck name must be ${LIMITS.DECK_NAME_MAX} characters or less`),
    cards: z
        .array(cardSchema)
        .max(LIMITS.CARDS_PER_DECK_MAX, `Maximum ${LIMITS.CARDS_PER_DECK_MAX} cards per deck`),
});

// Deck update schema
export const updateDeckSchema = z.object({
    name: z
        .string()
        .min(1, "Deck name is required")
        .max(LIMITS.DECK_NAME_MAX, `Deck name must be ${LIMITS.DECK_NAME_MAX} characters or less`)
        .optional(),
    isPublic: z.boolean().optional(),
});

// Card update schema
export const updateCardSchema = z.object({
    question: z
        .string()
        .min(1, "Question is required")
        .max(LIMITS.QUESTION_MAX, `Question must be ${LIMITS.QUESTION_MAX} characters or less`),
    answer: z
        .string()
        .min(1, "Answer is required")
        .max(LIMITS.ANSWER_MAX, `Answer must be ${LIMITS.ANSWER_MAX} characters or less`),
});

// Add card schema
export const addCardSchema = z.object({
    deckId: z.string().uuid("Invalid deck ID"),
    question: z
        .string()
        .min(1, "Question is required")
        .max(LIMITS.QUESTION_MAX, `Question must be ${LIMITS.QUESTION_MAX} characters or less`),
    answer: z
        .string()
        .min(1, "Answer is required")
        .max(LIMITS.ANSWER_MAX, `Answer must be ${LIMITS.ANSWER_MAX} characters or less`),
});

// Card level schema
export const cardLevelSchema = z.enum([
    "Nowe",
    "Nie umiem",
    "W miarę",
    "Umiem",
    "Opanowane 100%",
]);

// Types derived from schemas
export type CreateDeckInput = z.infer<typeof createDeckSchema>;
export type UpdateDeckInput = z.infer<typeof updateDeckSchema>;
export type CardInput = z.infer<typeof cardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type AddCardInput = z.infer<typeof addCardSchema>;
export type CardLevel = z.infer<typeof cardLevelSchema>;
