import { NextResponse } from "next/server";
import { db } from "@/db";
import { decks, flashcards, users } from "@/db/schema";
import { and, count, eq, inArray, isNotNull, isNull, lte, or } from "drizzle-orm";
import { buildDueReminder, getAppUrl, isValidTopic, publishToTopic } from "@/lib/ntfy";
import { deleteOrphanImages } from "@/db/images";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// At most one reminder per user per 20h (allows daily cron drift).
const REMINDER_COOLDOWN_MS = 20 * 60 * 60 * 1000;

// Unattached occlusion-image uploads (abandoned editor sessions) older
// than this are deleted to protect the Neon storage quota.
const ORPHAN_IMAGE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function isAuthorized(req: Request): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return true; // self-hosted cron without a secret configured
    const header = req.headers.get("authorization");
    if (header === `Bearer ${secret}`) return true;
    const url = new URL(req.url);
    return url.searchParams.get("secret") === secret;
}

/**
 * Daily reminder sweep. Triggered by Vercel Cron (see vercel.json) or any
 * external scheduler:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://<app>/api/cron/reminders
 */
export async function GET(req: Request) {
    if (!isAuthorized(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = Date.now();
    const appUrl = getAppUrl() || undefined;

    const candidates = await db.query.users.findMany({
        where: and(eq(users.ntfyEnabled, true), isNotNull(users.ntfyTopic)),
        columns: { id: true, ntfyTopic: true, lastReminderSentAt: true },
    });

    let sent = 0;
    let skippedNoDue = 0;
    let skippedRecent = 0;
    const errors: { userId: string; error: string }[] = [];

    for (const user of candidates) {
        const topic = user.ntfyTopic;
        if (!topic || !isValidTopic(topic)) continue;

        if (
            user.lastReminderSentAt &&
            now - user.lastReminderSentAt.getTime() < REMINDER_COOLDOWN_MS
        ) {
            skippedRecent++;
            continue;
        }

        try {
            const userDecks = await db.query.decks.findMany({
                where: eq(decks.ownerId, user.id),
                columns: { id: true },
            });
            if (userDecks.length === 0) {
                skippedNoDue++;
                continue;
            }

            const [{ value: dueCount }] = await db
                .select({ value: count() })
                .from(flashcards)
                .where(
                    and(
                        inArray(
                            flashcards.deckId,
                            userDecks.map((d) => d.id),
                        ),
                        or(isNull(flashcards.fsrsDue), lte(flashcards.fsrsDue, now)),
                    ),
                );

            if (!dueCount || dueCount === 0) {
                skippedNoDue++;
                continue;
            }

            await publishToTopic(topic, buildDueReminder(dueCount, undefined, appUrl));
            await db
                .update(users)
                .set({ lastReminderSentAt: new Date() })
                .where(eq(users.id, user.id));
            sent++;
        } catch (error) {
            errors.push({
                userId: user.id,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    return NextResponse.json({
        sent,
        skippedNoDue,
        skippedRecent,
        errors,
        orphanImagesDeleted: await deleteOrphanImages(ORPHAN_IMAGE_MAX_AGE_MS).catch(
            () => -1
        ),
    });
}
