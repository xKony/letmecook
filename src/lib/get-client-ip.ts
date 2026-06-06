import { headers } from "next/headers";

/**
 * Resolve client IP from request headers (proxy-aware).
 */
export async function getClientIP(): Promise<string> {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }
    const realIP = headersList.get("x-real-ip");
    if (realIP) {
        return realIP;
    }
    return "localhost";
}
