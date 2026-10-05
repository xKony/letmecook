/**
 * Allow only plain http(s) image URLs — no credentials, no exotic schemes.
 * Prefer https; allow http only for localhost during local development.
 *
 * Pasted/compressed images are `data:image/...` URLs instead. Those are
 * accepted separately (see `isAllowedImageDataUrl`) with their own size cap
 * so a pasted screenshot fits Neon (0.5 GB free tier) and localStorage.
 */

/** Max data-URL length (~800 KB of binary, base64-inflated). */
export const IMAGE_DATA_URL_MAX_LENGTH = 1_100_000;

const DATA_URL_RE = /^data:(image\/(?:png|jpeg|webp));base64,[A-Za-z0-9+/=]+$/;

/** Accept compressed pasted images (`data:image/png|jpeg|webp;base64,...`). */
export function isAllowedImageDataUrl(url: string): boolean {
    const trimmed = url.trim();
    if (trimmed.length > IMAGE_DATA_URL_MAX_LENGTH) return false;
    return DATA_URL_RE.test(trimmed);
}

export function isAllowedImageUrl(url: string | undefined | null): boolean {
    if (!url) return false;
    const trimmed = url.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith("data:")) return isAllowedImageDataUrl(trimmed);
    if (trimmed.length > 2048) return false;

    try {
        const parsed = new URL(trimmed);

        if (parsed.username || parsed.password) return false;

        if (parsed.protocol === "https:") return true;

        if (parsed.protocol === "http:") {
            const host = parsed.hostname.toLowerCase();
            return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
        }

        return false;
    } catch {
        return false;
    }
}

/** Returns a sanitized URL or undefined if the value is missing/invalid. */
export function sanitizeImageUrl(url: string | undefined | null): string | undefined {
    if (!url) return undefined;
    const trimmed = url.trim();
    if (!trimmed) return undefined;
    return isAllowedImageUrl(trimmed) ? trimmed : undefined;
}
