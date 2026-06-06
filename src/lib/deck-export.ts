import { Deck } from "@/lib/types";

/** Recommended import format: JSON array of { question, answer, image? }. */
export function deckToImportJson(deck: Deck): string {
    const cards = deck.cards.map(({ question, answer, image }) => {
        const entry: { question: string; answer: string; image?: string } = {
            question,
            answer,
        };
        if (image) entry.image = image;
        return entry;
    });

    return JSON.stringify(cards, null, 2);
}

export function downloadDeckJson(deck: Deck): void {
    const blob = new Blob([deckToImportJson(deck)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${deck.name}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
