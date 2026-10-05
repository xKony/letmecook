"use client";

import type { OcclusionData } from "@/lib/types";
import { splitDataUrl } from "@/lib/occlusion";
/**
 * Pasted-image pipeline for image occlusion.
 *
 * Screenshots pasted from Gretl/R/Python are usually 1080p+ PNGs
 * (0.5–2 MB) — far too big for a 0.5 GB Neon database or 5 MB
 * localStorage. Every image is therefore downscaled and re-encoded to
 * WebP *before* it is stored, which lands a statistics table at
 * ~40–120 KB with text that stays perfectly readable. True-lossless
 * storage would cost ~3× the bytes for no visible gain on tables/plots,
 * so visually-transparent lossy WebP (q0.85) is the default.
 */

export const OCCLUSION_IMAGE_MAX_DIM = 1600;
export const OCCLUSION_IMAGE_QUALITY = 0.85;
/** Post-compression cap: reject anything still larger than this. */
export const OCCLUSION_IMAGE_MAX_BYTES = 800_000;

export interface CompressedImage {
    /** `data:image/webp;base64,...` (or PNG fallback) ready to store. */
    dataUrl: string;
    width: number;
    height: number;
    /** Decoded binary size in bytes. */
    sizeBytes: number;
    mime: string;
}

/** Pull the first image file out of a paste event (Ctrl+V screenshot). */
export function extractImageFromPaste(e: ClipboardEvent): File | null {
    const items = e.clipboardData?.items;
    if (!items) return null;
    for (const item of items) {
        if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) return file;
        }
    }
    return null;
}

/** Pull the first image file out of a drag-and-drop event. */
export function extractImageFromDrop(e: DragEvent): File | null {
    const files = e.dataTransfer?.files;
    if (!files) return null;
    for (const file of files) {
        if (file.type.startsWith("image/")) return file;
    }
    return null;
}

function canvasToBlob(
    canvas: HTMLCanvasElement,
    mime: string,
    quality?: number
): Promise<Blob | null> {
    return new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
}

/**
 * Downscale + re-encode an image file to a compact WebP data URL.
 * Retries at smaller dimensions until the byte cap is met.
 */
export async function compressImageFile(file: File): Promise<CompressedImage> {
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) throw new Error("Could not decode the pasted image.");

    let dim = Math.min(
        OCCLUSION_IMAGE_MAX_DIM,
        Math.max(bitmap.width, bitmap.height)
    );
    let mime = "image/webp";

    for (let attempt = 0; attempt < 4; attempt += 1) {
        const scale = dim / Math.max(bitmap.width, bitmap.height);
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas is not available in this browser.");
        ctx.drawImage(bitmap, 0, 0, width, height);

        let blob = await canvasToBlob(canvas, "image/webp", OCCLUSION_IMAGE_QUALITY);
        if (!blob) {
            mime = "image/png";
            blob = await canvasToBlob(canvas, "image/png");
        }
        if (!blob) throw new Error("Could not encode the pasted image.");

        if (blob.size <= OCCLUSION_IMAGE_MAX_BYTES || dim <= 800) {
            const dataUrl = await blobToDataUrl(blob);
            bitmap.close();
            return { dataUrl, width, height, sizeBytes: blob.size, mime };
        }
        dim = Math.floor(dim * 0.75);
    }

    bitmap.close();
    throw new Error("Image is still too large after compression.");
}

function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Could not read the pasted image."));
        reader.readAsDataURL(blob);
    });
}

/** SHA-256 hex of a data URL's binary payload — the dedup key. */
export async function hashDataUrl(dataUrl: string): Promise<string> {    const split = splitDataUrl(dataUrl);
    if (!split) throw new Error("Not a valid pasted image.");
    const binary = atob(split.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (b) =>
        b.toString(16).padStart(2, "0")
    ).join("");
}

/**
 * Upload one inline occlusion image to the server store.
 * Returns the image id. Identical images dedupe server-side (SHA-256),
 * so "1 image = N cards" costs a single row.
 */
export async function uploadOcclusionImage(
    dataUrl: string,
    width?: number,
    height?: number
): Promise<string> {
    const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl, width, height }),
    });
    if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error || `Image upload failed (${res.status}).`);
    }
    const data = (await res.json()) as { id: string };
    if (!data?.id) throw new Error("Image upload failed.");
    return data.id;
}

/**
 * Deck-save choke point (auth mode): every card carrying an inline
 * `imageDataUrl` is uploaded first and swapped to an `imageId`.
 * The local copy keeps the data URL for instant rendering; the server
 * strips it before storing. Guests skip this and keep data URLs.
 *
 * Returns the save-ready cards plus the uploaded ids (for deck attach).
 */
export async function prepareCardsForSave<
    T extends { occlusion?: OcclusionData | null },
>(cards: T[]): Promise<{ cards: T[]; imageIds: string[] }> {
    const imageIds: string[] = [];
    const out = await Promise.all(
        cards.map(async (card) => {
            const occ = card.occlusion;
            if (!occ?.imageDataUrl || occ.imageId) return card;
            const imageId = await uploadOcclusionImage(
                occ.imageDataUrl,
                occ.width,
                occ.height
            );
            imageIds.push(imageId);
            return { ...card, occlusion: { ...occ, imageId } };
        })
    );
    return { cards: out, imageIds: [...new Set(imageIds)] };
}
