"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Globe, Download, Check, Loader2, BookOpen } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { motion } from "framer-motion";
import { getPublicDecks } from "@/app/actions/admin-actions";

interface PublicDeck {
    id: string;
    name: string;
    flashcards: { question: string; answer: string }[];
    owner: { name: string | null; email: string | null } | null;
}

export function GlobalDecksModal() {
    const { addDeck } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [decks, setDecks] = useState<PublicDeck[]>([]);
    const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);

    const fetchDecks = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const publicDecks = await getPublicDecks();
            setDecks(publicDecks as PublicDeck[]);
        } catch (err) {
            console.error("Failed to fetch public decks", err);
            setError("Failed to load library. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = (deck: PublicDeck) => {
        // Pass flashcards directly as objects - robust against special characters
        addDeck(deck.name, deck.flashcards);
        setDownloadedIds(prev => new Set(prev).add(deck.id));
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
                    <DialogTitle>Public Deck Library</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin mb-4" />
                            <p>Loading library...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <p className="text-rose-400 mb-4">{error}</p>
                            <Button variant="outline" onClick={fetchDecks}>
                                Retry
                            </Button>
                        </div>
                    ) : decks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <BookOpen className="w-12 h-12 mb-4 opacity-50" />
                            <p>No public decks available yet.</p>
                            <p className="text-sm mt-2">Check back later!</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {decks.map((deck, idx) => (
                                <motion.div
                                    key={deck.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50 hover:bg-card/80 transition-colors"
                                >
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold truncate">{deck.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {deck.flashcards.length} cards
                                            {deck.owner?.name && (
                                                <span className="ml-2 opacity-70">
                                                    by {deck.owner.name}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={downloadedIds.has(deck.id) ? "secondary" : "default"}
                                        onClick={() => handleImport(deck)}
                                        disabled={downloadedIds.has(deck.id)}
                                        className="ml-4 shrink-0"
                                    >
                                        {downloadedIds.has(deck.id) ? (
                                            <>
                                                <Check className="w-4 h-4 mr-1" /> Added
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4 mr-1" /> Import Copy
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
