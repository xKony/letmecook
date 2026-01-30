"use client";

import { useApp } from "@/lib/app-context";

// Type for export deck format (for migration)
interface ExportDeck {
    id: string;
    name: string;
    cards: {
        id: string;
        question: string;
        answer: string;
        level: string;
    }[];
    createdAt: number;
    updatedAt: number;
}

interface DeckExport {
    decks: ExportDeck[];
    exportedAt: string;
}

/**
 * Export current decks to JSON format for migration or backup
 */
export function useExportDecks() {
    const { decks } = useApp();

    const exportDecks = (): DeckExport => {
        const exportData: DeckExport = {
            decks: decks.map((deck) => ({
                id: deck.id,
                name: deck.name,
                cards: deck.cards.map((card) => ({
                    id: card.id,
                    question: card.question,
                    answer: card.answer,
                    level: card.level,
                })),
                createdAt: deck.createdAt,
                updatedAt: deck.updatedAt,
            })),
            exportedAt: new Date().toISOString(),
        };

        return exportData;
    };

    const downloadExport = () => {
        const exportData = exportDecks();

        if (exportData.decks.length === 0) {
            alert("No decks to export");
            return;
        }

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `letmecook-export-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return { exportDecks, downloadExport };
}
