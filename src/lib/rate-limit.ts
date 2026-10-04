
// Simple in-memory rate limiter for server actions.
// On multi-instance Vercel this is best-effort only — each isolate has its own Map.
// For production at scale, replace with @upstash/ratelimit + Redis.

interface RateLimitEntry {
    count: number;
    firstRequest: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;

    lastCleanup = now;
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now - entry.firstRequest > windowMs) {
            rateLimitStore.delete(key);
        }
    }
}

export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
}

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetIn: number;
}

/**
 * Check rate limit for a given identifier (usually IP or user ID)
 */
export async function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    const { windowMs, maxRequests } = config;
    const now = Date.now();
    const key = identifier;

    cleanup(windowMs);

    const entry = rateLimitStore.get(key);

    if (!entry) {
        rateLimitStore.set(key, { count: 1, firstRequest: now });
        return { success: true, remaining: maxRequests - 1, resetIn: Math.ceil(windowMs / 1000) };
    }

    if (now - entry.firstRequest > windowMs) {
        rateLimitStore.set(key, { count: 1, firstRequest: now });
        return { success: true, remaining: maxRequests - 1, resetIn: Math.ceil(windowMs / 1000) };
    }

    entry.count++;
    rateLimitStore.set(key, entry);

    const resetIn = Math.ceil((windowMs - (now - entry.firstRequest)) / 1000);

    if (entry.count > maxRequests) {
        return { success: false, remaining: 0, resetIn };
    }

    return { success: true, remaining: maxRequests - entry.count, resetIn };
}

/**
 * Read current rate-limit state without consuming a request slot.
 */
export function getRateLimitState(
    identifier: string,
    config: RateLimitConfig
): RateLimitResult {
    const { windowMs, maxRequests } = config;
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    if (!entry) {
        return { success: true, remaining: maxRequests, resetIn: Math.ceil(windowMs / 1000) };
    }

    if (now - entry.firstRequest > windowMs) {
        return { success: true, remaining: maxRequests, resetIn: Math.ceil(windowMs / 1000) };
    }

    const resetIn = Math.ceil((windowMs - (now - entry.firstRequest)) / 1000);
    const remaining = Math.max(0, maxRequests - entry.count);

    if (entry.count >= maxRequests) {
        return { success: false, remaining: 0, resetIn };
    }

    return { success: true, remaining, resetIn };
}

// Preset configurations for common use cases
export const RATE_LIMITS = {
    auth: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 10,
    },
    login: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 10,
    },
    register: {
        windowMs: 60 * 60 * 1000,
        maxRequests: 5,
    },
    passwordChange: {
        windowMs: 60 * 60 * 1000,
        maxRequests: 5,
    },
    api: {
        windowMs: 60 * 1000,
        maxRequests: 60,
    },
};
