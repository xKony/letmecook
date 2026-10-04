/**
 * ntfy.sh push reminder helpers.
 *
 * Each user gets a private, unguessable topic (the topic *is* the password —
 * anyone who knows it can read/publish). The topic is stored per user
 * (DB for auth users, localStorage for guests) and never exposed publicly.
 *
 * Pairing flow (works on iOS + Android):
 * 1. App shows a QR code encoding the subscribe URL `https://ntfy.sh/<topic>`.
 * 2. User scans it with the phone camera:
 *    - ntfy iOS/Android app (if installed) claims the universal link and
 *      opens the topic directly with a Subscribe prompt, or
 *    - the browser opens ntfy.sh/app with the topic prefilled.
 * 3. As a fallback the UI also offers an `ntfy://` deep-link button
 *    (Android) plus copy-topic / open-web-app buttons.
 *
 * Publishing: plain HTTP POST to `https://ntfy.sh/<topic>` with
 * Title / Priority / Tags / Click / Actions headers.
 */

export const NTFY_SERVER = "https://ntfy.sh";
const TOPIC_PREFIX = "letmecook";
const TOPIC_RE = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Generate a private topic like `letmecook-a3f9c1e7b2d84f6a`.
 * Uses Web Crypto — works in browsers and on the server (Node 20+).
 */
export function generateTopic(): string {
    const bytes = new Uint8Array(8);
    globalThis.crypto.getRandomValues(bytes);
    const suffix = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${TOPIC_PREFIX}-${suffix}`;
}

export function isValidTopic(topic: string): boolean {
    return TOPIC_RE.test(topic);
}

/** Web URL shown in the QR code: scanning opens ntfy app or web client. */
export function getSubscribeUrl(topic: string): string {
    return `${NTFY_SERVER}/${topic}`;
}

/** Native deep link — opens the ntfy Android app directly on the topic. */
export function getDeepLink(topic: string): string {
    return `ntfy://${NTFY_SERVER.replace(/^https?:\/\//, "")}/${topic}`;
}

export interface ReminderPayload {
    title: string;
    message: string;
    /** Where tapping the notification leads (the app's study page). */
    clickUrl?: string;
    tags?: string[];
    priority?: "min" | "low" | "default" | "high" | "urgent";
}

/** Base URL of the deployed app, used for notification tap-through. */
export function getAppUrl(): string {
    if (typeof process !== "undefined") {
        const explicit = process.env.NEXT_PUBLIC_APP_URL;
        if (explicit) return explicit.replace(/\/$/, "");
        const vercel = process.env.VERCEL_URL;
        if (vercel) return `https://${vercel}`;
    }
    return "";
}

/** Build the reminder content for N due cards. */
export function buildDueReminder(dueCount: number, deckName?: string, appUrl?: string): ReminderPayload {
    const where = deckName ? ` in "${deckName}"` : "";
    return {
        title: "Time to review! 🍳",
        message:
            dueCount === 1
                ? `1 flashcard${where} is due for review.`
                : `${dueCount} flashcards${where} are due for review.`,
        clickUrl: appUrl,
        tags: ["books", "mortar_board"],
        priority: "default",
    };
}

/** Publish a message to a topic. Used by API routes (server-side). */
export async function publishToTopic(topic: string, payload: ReminderPayload): Promise<void> {
    if (!isValidTopic(topic)) throw new Error("Invalid ntfy topic");

    const headers: Record<string, string> = {
        "Content-Type": "text/plain; charset=utf-8",
    };
    if (payload.title) headers["Title"] = payload.title;
    if (payload.priority) headers["Priority"] = payload.priority;
    if (payload.tags?.length) headers["Tags"] = payload.tags.join(",");
    if (payload.clickUrl) headers["Click"] = payload.clickUrl;
    // Action button that opens the app right from the notification.
    if (payload.clickUrl) {
        headers["Actions"] = `view, Open LetMeCook, ${payload.clickUrl}, clear=true`;
    }

    const res = await fetch(`${NTFY_SERVER}/${topic}`, {
        method: "POST",
        headers,
        body: payload.message,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`ntfy publish failed (${res.status}): ${text.slice(0, 200)}`);
    }
}
