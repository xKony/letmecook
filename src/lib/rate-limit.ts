"use server";

// Simple in-memory rate limiter for server actions
// For production at scale, consider using @upstash/ratelimit with Redis

interface RateLimitEntry {
    count: number;
    firstRequest: number;
}

// In-memory store (resets on server restart - acceptable for single instance)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
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
    windowMs: number;  // Time window in milliseconds
    maxRequests: number;  // Max requests per window
}

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetIn: number;  // Seconds until reset
}

/**
 * Check rate limit for a given identifier (usually IP or user ID)
 * @param identifier - Unique identifier for the client (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns RateLimitResult with success status and remaining requests
 */
export async function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    const { windowMs, maxRequests } = config;
    const now = Date.now();
    const key = identifier;

    // Periodic cleanup
    cleanup(windowMs);

    const entry = rateLimitStore.get(key);

    if (!entry) {
        // First request in this window
        rateLimitStore.set(key, { count: 1, firstRequest: now });
        return { success: true, remaining: maxRequests - 1, resetIn: Math.ceil(windowMs / 1000) };
    }

    // Check if window has expired
    if (now - entry.firstRequest > windowMs) {
        // Reset the window
        rateLimitStore.set(key, { count: 1, firstRequest: now });
        return { success: true, remaining: maxRequests - 1, resetIn: Math.ceil(windowMs / 1000) };
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    const resetIn = Math.ceil((windowMs - (now - entry.firstRequest)) / 1000);

    if (entry.count > maxRequests) {
        return { success: false, remaining: 0, resetIn };
    }

    return { success: true, remaining: maxRequests - entry.count, resetIn };
}

// Preset configurations for common use cases
export const RATE_LIMITS = {
    // Auth endpoints - strict to prevent brute force
    auth: {
        windowMs: 15 * 60 * 1000,  // 15 minutes
        maxRequests: 5,  // 5 attempts per 15 min
    },
    // Login specifically - slightly more lenient
    login: {
        windowMs: 15 * 60 * 1000,  // 15 minutes
        maxRequests: 10,  // 10 attempts per 15 min
    },
    // Registration - very strict to prevent spam
    register: {
        windowMs: 60 * 60 * 1000,  // 1 hour
        maxRequests: 3,  // 3 registrations per hour
    },
    // Password change - strict
    passwordChange: {
        windowMs: 60 * 60 * 1000,  // 1 hour
        maxRequests: 5,  // 5 attempts per hour
    },
    // General API - more lenient
    api: {
        windowMs: 60 * 1000,  // 1 minute
        maxRequests: 60,  // 60 requests per minute
    },
};
