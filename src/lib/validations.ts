import { z } from "zod";
import { isAllowedImageUrl } from "@/lib/image-url";

// ============================================
// Deck/Card Validation Schemas
// ============================================

// Limits to prevent abuse
export const LIMITS = {
    DECK_NAME_MAX: 100,
    CARDS_PER_DECK_MAX: 500,
    QUESTION_MAX: 5000,
    ANSWER_MAX: 10000,
    PASSWORD_MIN: 8,
    PASSWORD_MAX: 128,
    EMAIL_MAX: 255,
    NAME_MAX: 50,
} as const;

const optionalImageSchema = z
    .string()
    .max(2048)
    .optional()
    .refine((val) => val === undefined || val === "" || isAllowedImageUrl(val), {
        message: "Image URL must be a valid https URL",
    })
    .transform((val) => (val && val.trim() ? val.trim() : undefined));

// Single card schema
export const cardSchema = z.object({
    question: z
        .string()
        .min(1, "Question is required")
        .max(LIMITS.QUESTION_MAX, `Question must be ${LIMITS.QUESTION_MAX} characters or less`),
    answer: z
        .string()
        .max(LIMITS.ANSWER_MAX, `Answer must be ${LIMITS.ANSWER_MAX} characters or less`),
    image: optionalImageSchema,
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

// ============================================
// Auth Validation Schemas
// ============================================

export const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .max(LIMITS.NAME_MAX, `Name must be ${LIMITS.NAME_MAX} characters or less`)
        .optional()
        .transform((val) => (val && val.length > 0 ? val : undefined)),
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Invalid email address")
        .max(LIMITS.EMAIL_MAX, `Email must be ${LIMITS.EMAIL_MAX} characters or less`),
    password: z
        .string()
        .min(LIMITS.PASSWORD_MIN, `Password must be at least ${LIMITS.PASSWORD_MIN} characters`)
        .max(LIMITS.PASSWORD_MAX, `Password must be ${LIMITS.PASSWORD_MAX} characters or less`),
});

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Invalid email address")
        .max(LIMITS.EMAIL_MAX),
    password: z
        .string()
        .min(1, "Password is required")
        .max(LIMITS.PASSWORD_MAX),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required").max(LIMITS.PASSWORD_MAX),
    newPassword: z
        .string()
        .min(LIMITS.PASSWORD_MIN, `Password must be at least ${LIMITS.PASSWORD_MIN} characters`)
        .max(LIMITS.PASSWORD_MAX, `Password must be ${LIMITS.PASSWORD_MAX} characters or less`),
});

export const changeNameSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Name cannot be empty")
        .max(LIMITS.NAME_MAX, `Name must be ${LIMITS.NAME_MAX} characters or less`),
});

// Types derived from schemas
export type CreateDeckInput = z.infer<typeof createDeckSchema>;
export type UpdateDeckInput = z.infer<typeof updateDeckSchema>;
export type CardInput = z.infer<typeof cardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type AddCardInput = z.infer<typeof addCardSchema>;
export type CardLevel = z.infer<typeof cardLevelSchema>;
