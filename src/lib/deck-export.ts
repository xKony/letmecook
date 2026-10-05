import { Deck, OcclusionData } from "@/lib/types";

/**
 * Fetch server-stored image bytes as a data URL so exports are
 * self-contained (importable anywhere, including guest mode).
 */
async function imageIdToDataUrl(imageId: string): Promise<string | undefined> {
    try {
        const res = await fetch(`/api/images/${imageId}`);
        if (!res.ok) return undefined;
        const blob = await res.blob();
        return await new Promise<string | undefined>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => resolve(undefined);
            reader.readAsDataURL(blob);
        });
    } catch {
        return undefined;
    }
}

/** Recommended import format: JSON array of { question, answer, image?, occlusion? }. */
export async function deckToImportJson(deck: Deck): Promise<string> {
    const cards = await Promise.all(
        deck.cards.map(async ({ question, answer, image, occlusion }) => {
            const entry: {
                question: string;
                answer: string;
                image?: string;
                occlusion?: OcclusionData;
            } = { question, answer };
            if (image) entry.image = image;
            if (occlusion && occlusion.masks.length > 0) {
                let imageDataUrl = occlusion.imageDataUrl;
                if (!imageDataUrl && occlusion.imageId) {
                    imageDataUrl = await imageIdToDataUrl(occlusion.imageId);
                }
                // Only export occlusion when the image travels with it —
                // a bare imageId is meaningless outside this account.
                if (imageDataUrl) {
                    entry.occlusion = { ...occlusion, imageId: undefined, imageDataUrl };
                }
            }
            return entry;
        })
    );

    return JSON.stringify(cards, null, 2);
}

export async function downloadDeckJson(deck: Deck): Promise<void> {
    const blob = new Blob([await deckToImportJson(deck)], {
        type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${deck.name}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
