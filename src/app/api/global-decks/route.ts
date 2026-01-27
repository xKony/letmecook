import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Option 1: Fetch from a URL (e.g., Raw Gist of "questions.txt")
        const dataUrl = process.env.GLOBAL_DECKS_URL;

        let allDecks = [];

        if (dataUrl) {
            const res = await fetch(dataUrl);
            if (!res.ok) throw new Error("Failed to fetch decks");
            const text = await res.text();

            // Parse raw text: Question | Answer
            const cards = [];
            const lines = text.split("\n");

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                const parts = trimmed.split("|");
                if (parts.length >= 2) {
                    cards.push({
                        question: parts[0].trim(),
                        answer: parts.slice(1).join("|").trim()
                    });
                }
            }

            if (cards.length > 0) {
                // In this simple global model, we wrap the whole file into one deck
                // If you want multiple decks from multiple files, the logic would need to change
                // or the file format needs to support delimiters. 
                // For now: One file = One Global Deck.
                allDecks.push({
                    name: "Global Library (Imported)",
                    cards: cards
                });
            }
        }

        // Return valid response even if empty
        return NextResponse.json({ decks: allDecks });

    } catch (error) {
        console.error("Global decks error:", error);
        return NextResponse.json({ error: "Failed to load global decks" }, { status: 500 });
    }
}
