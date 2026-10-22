import { and, eq, inArray, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { deckImages } from "@/db/schema";

/**
 * Link uploaded images to their deck after it is created/saved.
 * Only rows owned by the caller are touched; foreign ids are ignored.
 * Attached images are deleted with the deck (FK cascade).
 */
export async function attachImagesToDeck(
    userId: string,
    deckId: string,
    imageIds: string[]
): Promise<void> {
    const ids = [...new Set(imageIds.filter((id) => typeof id === "string" && id))];
    if (ids.length === 0) return;
    await db
        .update(deckImages)
        .set({ deckId })
        .where(and(eq(deckImages.ownerId, userId), inArray(deckImages.id, ids)));
}

/**
 * Delete unattached editor uploads older than `olderThanMs`.
 * Runs from the cron route; attached images die with their deck instead.
 * Returns the number of deleted rows.
 */
export async function deleteOrphanImages(olderThanMs: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanMs);
    const orphans = await db
        .delete(deckImages)
        .where(and(isNull(deckImages.deckId), lt(deckImages.createdAt, cutoff)))
        .returning({ id: deckImages.id });
    return orphans.length;
}
