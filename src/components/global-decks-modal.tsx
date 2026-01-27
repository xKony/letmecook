"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Globe, Download, Check } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { motion } from "framer-motion";

interface GlobalDeck {
    name: string;
    cards: { question: string; answer: string }[];
}

export function GlobalDecksModal() {
    const { addDeck } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [decks, setDecks] = useState<GlobalDeck[]>([]);
    const [downloadedIds, setDownloadedIds] = useState<Set<number>>(new Set());

    const fetchDecks = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/global-decks");
            const data = await res.json();
            if (data.decks) {
                setDecks(data.decks);
            }
        } catch (error) {
            console.error("Failed to fetch global decks", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = (deck: GlobalDeck, index: number) => {
        // Create content string in "Question | Answer" format
        const content = deck.cards.map(c => `${c.question} | ${c.answer}`).join("\n");
        addDeck(deck.name, content);
        setDownloadedIds(prev => new Set(prev).add(index));
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (open && decks.length === 0) fetchDecks();
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Globe className="w-4 h-4" />
                    Browse Library
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Global Deck Library</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading library...</div>
                    ) : decks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No decks found currently.</div>
                    ) : (
                        <div className="grid gap-4">
                            {decks.map((deck, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors"
                                >
                                    <div>
                                        <h3 className="font-semibold">{deck.name}</h3>
                                        <p className="text-sm text-muted-foreground">{deck.cards.length} cards</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={downloadedIds.has(idx) ? "secondary" : "default"}
                                        onClick={() => handleImport(deck, idx)}
                                        disabled={downloadedIds.has(idx)}
                                    >
                                        {downloadedIds.has(idx) ? (
                                            <>
                                                <Check className="w-4 h-4 mr-1" /> Added
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4 mr-1" /> Import
                                            </>
                                        )}
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
