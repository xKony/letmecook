import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { deckImages, decks, deckPermissions } from "@/db/schema";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Serve one stored occlusion image's bytes.
 *
 * Visible to the owner, plus anyone who can see the deck the image is
 * attached to (public library decks, shared decks). Unattached
 * (in-progress editor upload) rows are owner-only. Immutable + long-lived
 * cache: bytes never change for an id.
 */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const { id } = await params;

    const image = await db.query.deckImages.findFirst({
        where: eq(deckImages.id, id),
    });
    if (!image) {
        return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }

    if (image.ownerId !== userId) {
        if (!image.deckId) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 });
        }
        const deck = await db.query.decks.findFirst({
            where: eq(decks.id, image.deckId),
            columns: { id: true, ownerId: true, isPublic: true },
        });
        if (!deck) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 });
        }
        const allowed =
            deck.isPublic ||
            deck.ownerId === userId ||
            (await db.query.deckPermissions.findFirst({
                where: and(
                    eq(deckPermissions.deckId, deck.id),
                    eq(deckPermissions.userId, userId)
                ),
            }));
        if (!allowed) {
            return NextResponse.json({ error: "Forbidden." }, { status: 403 });
        }
    }

    return new Response(Buffer.from(image.data, "base64"), {
        headers: {
            "Content-Type": image.mime,
            "Content-Length": String(image.sizeBytes),
            "Cache-Control": "public, max-age=31536000, immutable",
        },
    });
}
