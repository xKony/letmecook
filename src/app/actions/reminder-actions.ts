"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import {
    buildDueReminder,
    generateTopic,
    getAppUrl,
    isValidTopic,
    publishToTopic,
} from "@/lib/ntfy";

async function requireUserId(): Promise<string> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    return session.user.id;
}

export interface ReminderSettings {
    topic: string;
    enabled: boolean;
}

/**
 * Get the caller's reminder settings, lazily creating a private topic.
 * The topic is unguessable and acts as the password — never expose it
 * publicly, only to its owner over an authenticated session.
 */
export async function getReminderSettings(): Promise<ReminderSettings> {
    const userId = await requireUserId();

    const row = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { ntfyTopic: true, ntfyEnabled: true },
    });
    if (!row) throw new Error("User not found");

    if (row.ntfyTopic && isValidTopic(row.ntfyTopic)) {
        return { topic: row.ntfyTopic, enabled: row.ntfyEnabled };
    }

    const topic = generateTopic();
    await db.update(users).set({ ntfyTopic: topic }).where(eq(users.id, userId));
    return { topic, enabled: row.ntfyEnabled };
}

/** Rotate to a fresh topic (invalidates the old subscription). */
export async function regenerateReminderTopic(): Promise<ReminderSettings> {
    const userId = await requireUserId();
    const topic = generateTopic();
    await db
        .update(users)
        .set({ ntfyTopic: topic, ntfyEnabled: false })
        .where(eq(users.id, userId));
    return { topic, enabled: false };
}

export async function setRemindersEnabled(enabled: boolean): Promise<ReminderSettings> {
    const userId = await requireUserId();
    const current = await getReminderSettings();
    await db.update(users).set({ ntfyEnabled: enabled }).where(eq(users.id, userId));
    return { topic: current.topic, enabled };
}

/** Publish a test notification so the user can verify pairing worked. */
export async function sendTestReminder(): Promise<{ ok: boolean }> {
    const { topic } = await getReminderSettings();
    await publishToTopic(topic, {
        title: "LetMeCook test 🔔",
        message: "Pairing works! You'll get a reminder here when reviews are due.",
        clickUrl: getAppUrl() || undefined,
        tags: ["tada"],
        priority: "default",
    });
    return { ok: true };
}

/** Publish a "due cards" reminder to the caller's own topic. */
export async function sendDueReminderNow(dueCount: number): Promise<{ ok: boolean }> {
    if (!Number.isFinite(dueCount) || dueCount < 0) throw new Error("Invalid count");
    const { topic } = await getReminderSettings();
    await publishToTopic(topic, {
        ...buildDueReminder(dueCount, undefined, getAppUrl() || undefined),
    });
    return { ok: true };
}
