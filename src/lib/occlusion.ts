import type { Flashcard, OcclusionData, OcclusionMask } from "@/lib/types";
/** Smallest mask edge (fraction of image size) — filters out misclicks. */
export const MIN_MASK_EDGE = 0.008;

/** Number of decimal places kept for mask fractions. */
const MASK_PRECISION = 4;

function round4(n: number): number {
    return Math.round(n * 10 ** MASK_PRECISION) / 10 ** MASK_PRECISION;
}

function clamp01(n: number): number {
    return Math.min(1, Math.max(0, n));
}

/** True when the card hides part of an image instead of asking text. */
export function isOcclusionCard(card: {
    occlusion?: OcclusionData | null;
}): boolean {
    return !!card.occlusion && card.occlusion.masks.length > 0;
}

/** The mask this card asks about (falls back to the first mask). */
export function getActiveMask(occlusion: OcclusionData): OcclusionMask | undefined {
    return (
        occlusion.masks.find((m) => m.id === occlusion.activeMaskId) ??
        occlusion.masks[0]
    );
}

/**
 * Resolve the image source for an occlusion payload: inline data URL
 * (guest mode / exports) or the serving route for server-stored images.
 */
export function getOcclusionImageSrc(occlusion: OcclusionData): string | undefined {
    if (occlusion.imageDataUrl) return occlusion.imageDataUrl;
    if (occlusion.imageId) return `/api/images/${occlusion.imageId}`;
    return undefined;
}

/** Clamp a mask into 0..1 bounds and drop degenerate (zero-area) masks. */
export function sanitizeMasks(masks: OcclusionMask[]): OcclusionMask[] {
    return masks
        .map((m) => ({
            ...m,
            x: round4(clamp01(m.x)),
            y: round4(clamp01(m.y)),
            w: round4(clamp01(m.w)),
            h: round4(clamp01(m.h)),
            label: m.label?.trim() ? m.label.trim().slice(0, 200) : undefined,
        }))
        .filter((m) => m.w >= MIN_MASK_EDGE && m.h >= MIN_MASK_EDGE);
}

/**
 * Parse occlusion JSON from persistence (DB text column / localStorage).
 * Returns undefined for anything that is not a well-formed payload —
 * corrupted data degrades to a regular card instead of crashing.
 */
export function parseOcclusionJson(raw: string | null | undefined): OcclusionData | undefined {
    if (!raw) return undefined;
    try {
        return normalizeOcclusion(JSON.parse(raw));
    } catch {
        return undefined;
    }
}

/**
 * Sanitize an unknown value (parsed JSON, localStorage object, import
 * payload) into occlusion data. Accepts objects and JSON strings.
 */
export function normalizeOcclusion(input: unknown): OcclusionData | undefined {
    if (typeof input === "string") {
        try {
            return normalizeOcclusion(JSON.parse(input));
        } catch {
            return undefined;
        }
    }
    const parsed = input as Partial<OcclusionData>;
    if (!parsed || !Array.isArray(parsed.masks) || parsed.masks.length === 0) {
        return undefined;
    }
    if (typeof parsed.activeMaskId !== "string" || !parsed.activeMaskId) {
        return undefined;
    }
    const masks = sanitizeMasks(
        parsed.masks.filter(
            (m): m is OcclusionMask =>
                !!m &&
                typeof m.id === "string" &&
                typeof m.x === "number" &&
                typeof m.y === "number" &&
                typeof m.w === "number" &&
                typeof m.h === "number"
        )
    );
    if (masks.length === 0) return undefined;
    if (!masks.some((m) => m.id === parsed.activeMaskId)) return undefined;
    if (typeof parsed.imageId !== "string" && typeof parsed.imageDataUrl !== "string") {
        return undefined;
    }
    const width =
        typeof parsed.width === "number" && Number.isFinite(parsed.width) && parsed.width > 0
            ? parsed.width
            : undefined;
    const height =
        typeof parsed.height === "number" && Number.isFinite(parsed.height) && parsed.height > 0
            ? parsed.height
            : undefined;
    return {
        imageId: typeof parsed.imageId === "string" ? parsed.imageId : undefined,
        imageDataUrl:
            typeof parsed.imageDataUrl === "string" ? parsed.imageDataUrl : undefined,
        masks,
        activeMaskId: parsed.activeMaskId,
        width,
        height,
    };
}

/** Serialize occlusion for persistence (DB text column). */
export function serializeOcclusion(
    occlusion: OcclusionData | null | undefined
): string | null {
    if (!occlusion || occlusion.masks.length === 0) return null;
    return JSON.stringify(occlusion);
}

/** Default question/answer text for a generated occlusion card. */
export function occlusionCardText(
    mask: OcclusionMask,
    index: number
): { question: string; answer: string } {
    const fallback = `Hidden part ${index + 1}`;
    const text = mask.label?.trim() || fallback;
    return { question: text, answer: text };
}

/** Narrow a Flashcard to its occlusion payload (undefined for text cards). */
export function getCardOcclusion(card: Flashcard): OcclusionData | undefined {
    return card.occlusion ?? undefined;
}

const DATA_URL_RE = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/;

/**
 * Split a `data:image/...;base64,...` URL into mime + raw base64.
 * Server-safe (no browser APIs) — shared by the upload route.
 */
export function splitDataUrl(dataUrl: string): { mime: string; base64: string } | null {
    const match = DATA_URL_RE.exec(dataUrl.trim());
    if (!match) return null;
    return { mime: match[1], base64: match[2] };
}

/** Approximate binary size of a base64 payload without decoding it. */
export function base64SizeBytes(base64: string): number {
    const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
    return Math.floor((base64.length * 3) / 4) - padding;
}
