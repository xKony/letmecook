/**
 * Allow only plain http(s) image URLs — no credentials, no exotic schemes.
 * Prefer https; allow http only for localhost during local development.
 */
export function isAllowedImageUrl(url: string): boolean {
    const trimmed = url.trim();
    if (!trimmed || trimmed.length > 2048) return false;

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
