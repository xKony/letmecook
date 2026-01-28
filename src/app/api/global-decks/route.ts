import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Option 1: Fetch from a URL (e.g., Raw Gist of "questions.txt")
        const dataUrl = process.env.GLOBAL_DECKS_URL;

        let allDecks: { name: string; cards: { question: string; answer: string; imageUrl?: string }[] }[] = [];

        if (dataUrl) {
            const res = await fetch(dataUrl);
            if (!res.ok) throw new Error("Failed to fetch decks");
            const text = await res.text();

            const lines = text.split("\n").map(l => l.trim()).filter(l => l);

            // Detect if this is a Master Index (DeckName | URL) or a Single Deck (Question | Answer)
            // Heuristic: If the second part starts with http, it's an index.
            const isIndex = lines.some(line => {
                const parts = line.split("|");
                return parts.length >= 2 && parts[1].trim().startsWith("http");
            });

            if (isIndex) {
                // MASTER INDEX MODE
                const promises = lines.map(async (line) => {
                    const parts = line.split("|");
                    if (parts.length < 2) return null;

                    const deckName = parts[0].trim();
                    const deckUrl = parts[1].trim();

                    try {
                        const deckRes = await fetch(deckUrl);
                        if (!deckRes.ok) return null;
                        const deckText = await deckRes.text();

                        const cards: { question: string; answer: string; imageUrl?: string }[] = [];
                        const deckLines = deckText.split("\n");
                        for (const dLine of deckLines) {
                            const dParts = dLine.trim().split("|");
                            if (dParts.length >= 2) {
                                cards.push({
                                    question: dParts[0].trim(),
                                    answer: dParts[1].trim(),
                                    imageUrl: dParts[2]?.trim() || undefined
                                });
                            }
                        }

                        if (cards.length > 0) {
                            return { name: deckName, cards };
                        }
                    } catch (e) {
                        console.error(`Failed to load deck: ${deckName}`, e);
                    }
                    return null;
                });

                const results = await Promise.all(promises);
                allDecks = results.filter((d): d is { name: string; cards: { question: string; answer: string; imageUrl?: string }[] } => d !== null);

            } else {
                // SINGLE DECK MODE (Backward Compatibility)
                const cards: { question: string; answer: string; imageUrl?: string }[] = [];
                for (const line of lines) {
                    const parts = line.split("|");
                    if (parts.length >= 2) {
                        cards.push({
                            question: parts[0].trim(),
                            answer: parts[1].trim(),
                            imageUrl: parts[2]?.trim() || undefined
                        });
                    }
                }

                if (cards.length > 0) {
                    allDecks.push({
                        name: "Global Library (Imported)",
                        cards: cards
                    });
                }
            }
        }

        // Return valid response even if empty
        return NextResponse.json({ decks: allDecks });

    } catch (error) {
        console.error("Global decks error:", error);
        return NextResponse.json({ error: "Failed to load global decks" }, { status: 500 });
    }
}
