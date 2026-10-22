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
 * Publishing: JSON `POST` to `https://ntfy.sh` (`{"topic", ...}` — see
 * https://docs.ntfy.sh/publish/#publish-as-json). JSON keeps title/message
 * in a UTF-8 body, so emoji and non-Latin text are safe. Plain header
 * publishing (`Title: ...`) breaks in browsers: fetch rejects header values
 * outside ISO-8859-1 ("String contains non ISO-8859-1 code point").
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

const PRIORITY_IDS = { min: 1, low: 2, default: 3, high: 4, urgent: 5 } as const;

/**
 * Publish a message to a topic. Used by API routes (server-side) and by the
 * guest pairing UI straight from the browser (client-side).
 */
export async function publishToTopic(topic: string, payload: ReminderPayload): Promise<void> {
    if (!isValidTopic(topic)) throw new Error("Invalid ntfy topic");

    const body: Record<string, unknown> = {
        topic,
        message: payload.message,
    };
    if (payload.title) body.title = payload.title;
    if (payload.priority) body.priority = PRIORITY_IDS[payload.priority];
    if (payload.tags?.length) body.tags = payload.tags;
    if (payload.clickUrl) body.click = payload.clickUrl;
    // Action button that opens the app right from the notification.
    if (payload.clickUrl) {
        body.actions = [
            { action: "view", label: "Open LetMeCook", url: payload.clickUrl, clear: true },
        ];
    }

    const res = await fetch(NTFY_SERVER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`ntfy publish failed (${res.status}): ${text.slice(0, 200)}`);
    }
}
