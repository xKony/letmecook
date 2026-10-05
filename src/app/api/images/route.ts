import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { and, eq, sum } from "drizzle-orm";
import { db } from "@/db";
import { deckImages } from "@/db/schema";
import { auth } from "@/lib/auth";
import { LIMITS } from "@/lib/validations";
import { base64SizeBytes, splitDataUrl } from "@/lib/occlusion";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function isValidDimension(n: unknown): n is number {
    return typeof n === "number" && Number.isInteger(n) && n > 0 && n <= 8000;
}

/**
 * Upload a compressed occlusion image.
 *
 * Body: `{ dataUrl, width?, height? }` where `dataUrl` is a
 * `data:image/...;base64,...` URL produced by the client-side pipeline
 * (`compressImageFile` already downscales + WebP-encodes, so uploads are
 * ~40–120 KB instead of multi-MB screenshots).
 *
 * Storage discipline (Neon free tier is 0.5 GB/project):
 * - dedup by SHA-256 per owner — identical images (and "1 image = N cards")
 *   store exactly one row;
 * - per-image byte cap + per-user quota, both rejected with 413;
 * - rows start unattached (`deckId` NULL) and are linked when the deck is
 *   saved; orphan rows are swept by the cron route.
 */
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const limited = await checkRateLimit(`images:${userId}`, {
        windowMs: 60_000,
        maxRequests: 20,
    });
    if (!limited.success) {
        return NextResponse.json({ error: "Too many uploads, slow down." }, { status: 429 });
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const { dataUrl, width, height } = (body ?? {}) as {
        dataUrl?: unknown;
        width?: unknown;
        height?: unknown;
    };
    if (typeof dataUrl !== "string") {
        return NextResponse.json({ error: "Missing image." }, { status: 400 });
    }
    const split = splitDataUrl(dataUrl);
    if (!split) {
        return NextResponse.json(
            { error: "Image must be a pasted PNG, JPEG, or WebP image." },
            { status: 400 }
        );
    }

    const sizeBytes = base64SizeBytes(split.base64);
    if (sizeBytes === 0 || sizeBytes > LIMITS.OCCLUSION_IMAGE_MAX_BYTES) {
        return NextResponse.json(
            { error: "Image is too large after compression." },
            { status: 413 }
        );
    }

    // Recompute the hash server-side — the dedup key must be trustworthy.
    const hash = createHash("sha256")
        .update(Buffer.from(split.base64, "base64"))
        .digest("hex");

    const existing = await db.query.deckImages.findFirst({
        where: and(eq(deckImages.ownerId, userId), eq(deckImages.hash, hash)),
        columns: { id: true },
    });
    if (existing) {
        return NextResponse.json({ id: existing.id, deduped: true });
    }

    const [usage] = await db
        .select({ total: sum(deckImages.sizeBytes) })
        .from(deckImages)
        .where(eq(deckImages.ownerId, userId));
    const usedBytes = Number(usage?.total ?? 0);
    if (usedBytes + sizeBytes > LIMITS.USER_IMAGE_QUOTA_BYTES) {
        return NextResponse.json(
            { error: "Image storage quota exceeded. Delete a deck with images to free space." },
            { status: 413 }
        );
    }

    const [image] = await db
        .insert(deckImages)
        .values({
            ownerId: userId,
            hash,
            mime: split.mime,
            data: split.base64,
            sizeBytes,
            width: isValidDimension(width) ? width : null,
            height: isValidDimension(height) ? height : null,
        })
        .returning({ id: deckImages.id });

    return NextResponse.json({ id: image.id, deduped: false });
}
