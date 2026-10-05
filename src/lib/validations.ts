import { z } from "zod";
import { isAllowedImageUrl, IMAGE_DATA_URL_MAX_LENGTH } from "@/lib/image-url";

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
    /** Max inline pasted image (`data:` URL chars ≈ 800 KB binary). */
    OCCLUSION_IMAGE_DATA_URL_MAX: IMAGE_DATA_URL_MAX_LENGTH,
    /** Max masks per occlusion image (1 image = N cards). */
    OCCLUSION_MASKS_MAX: 50,
    /** Max prompt text per mask. */
    OCCLUSION_LABEL_MAX: 200,
    /** Post-compression binary cap enforced by the upload route. */
    OCCLUSION_IMAGE_MAX_BYTES: 800_000,
    /** Per-user image storage quota (Neon free tier is 0.5 GB/project). */
    USER_IMAGE_QUOTA_BYTES: 200 * 1024 * 1024,
} as const;

const optionalImageSchema = z
    .string()
    .max(LIMITS.OCCLUSION_IMAGE_DATA_URL_MAX)
    .optional()
    .refine((val) => val === undefined || val === "" || isAllowedImageUrl(val), {
        message: "Image must be a valid https URL or a pasted image",
    })
    .transform((val) => (val && val.trim() ? val.trim() : undefined));

// Image occlusion payload (masks are fractions 0..1 of image size)
export const occlusionMaskSchema = z.object({
    id: z.string().min(1).max(64),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    w: z.number().gt(0).max(1),
    h: z.number().gt(0).max(1),
    label: z.string().max(LIMITS.OCCLUSION_LABEL_MAX).optional(),
});

export const occlusionDataSchema = z
    .object({
        imageId: z.string().uuid().optional(),
        imageDataUrl: z
            .string()
            .max(LIMITS.OCCLUSION_IMAGE_DATA_URL_MAX)
            .refine((val) => isAllowedImageUrl(val), {
                message: "Occlusion image must be a valid pasted image",
            })
            .optional(),
        masks: z
            .array(occlusionMaskSchema)
            .min(1)
            .max(LIMITS.OCCLUSION_MASKS_MAX),
        activeMaskId: z.string().min(1).max(64),
        width: z.number().int().positive().max(8000).optional(),
        height: z.number().int().positive().max(8000).optional(),
    })
    .refine((o) => !!o.imageId || !!o.imageDataUrl, {
        message: "Occlusion needs an image",
    })
    .refine((o) => o.masks.some((m) => m.id === o.activeMaskId), {
        message: "Active mask not found",
    });

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
    occlusion: occlusionDataSchema.optional(),
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

export const cardLevelSchema = z.enum([
    "Nowe",
    "Nie umiem",
    "W miarę",
    "Umiem",
    "Opanowane 100%",
]);

// Card update schema
export const updateCardSchema = z.object({
    question: z
        .string()
        .min(1, "Question is required")
        .max(LIMITS.QUESTION_MAX, `Question must be ${LIMITS.QUESTION_MAX} characters or less`),
    answer: z
        .string()
        .max(LIMITS.ANSWER_MAX, `Answer must be ${LIMITS.ANSWER_MAX} characters or less`),
    image: z.string().optional(),
});

// Sync deck cards schema (bulk edit)
export const syncCardSchema = z.object({
    id: z.string().optional(),
    question: z
        .string()
        .min(1, "Question is required")
        .max(LIMITS.QUESTION_MAX, `Question must be ${LIMITS.QUESTION_MAX} characters or less`),
    answer: z
        .string()
        .max(LIMITS.ANSWER_MAX, `Answer must be ${LIMITS.ANSWER_MAX} characters or less`),
    image: z.string().max(LIMITS.OCCLUSION_IMAGE_DATA_URL_MAX).optional(),
    occlusion: occlusionDataSchema.optional(),
    level: cardLevelSchema.optional(),
});

export const syncDeckCardsSchema = z.object({
    deckId: z.string().uuid("Invalid deck ID"),
    cards: z
        .array(syncCardSchema)
        .max(LIMITS.CARDS_PER_DECK_MAX, `Maximum ${LIMITS.CARDS_PER_DECK_MAX} cards per deck`),
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
export type OcclusionMaskInput = z.infer<typeof occlusionMaskSchema>;
export type OcclusionDataInput = z.infer<typeof occlusionDataSchema>;
