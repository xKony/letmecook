"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/app-context";
import { useTTS } from "@/hooks/use-tts";
import { FlashcardComponent } from "@/components/flashcard";
import { Button } from "@/components/ui/button";
import { CardLevel } from "@/lib/types";
import {
    ArrowLeft,
    ArrowRight,
    Shuffle,
    RotateCcw,
    X,
    Hash,
} from "lucide-react";

export function StudySession() {
    const { currentDeck, closeDeck, resetCurrentDeck, updateCardLevel } = useApp();
    const { enabled: ttsEnabled, speak, toggle: toggleTTS } = useTTS();

    const [playIndex, setPlayIndex] = useState(0);
    const [playOrder, setPlayOrder] = useState<number[]>([]);
    const [isShuffled, setIsShuffled] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);
    const [showGotoModal, setShowGotoModal] = useState(false);
    const [gotoInput, setGotoInput] = useState("");

    // Initialize play order
    useEffect(() => {
        if (currentDeck) {
            setPlayOrder(currentDeck.cards.map((_, i) => i));
            setPlayIndex(0);
            setIsRevealed(false);
        }
    }, [currentDeck?.id]);

    // Current card
    const currentCard = useMemo(() => {
        if (!currentDeck || playOrder.length === 0) return null;
        const realIndex = playOrder[playIndex];
        return currentDeck.cards[realIndex] || null;
    }, [currentDeck, playOrder, playIndex]);

    // TTS on card change
    useEffect(() => {
        if (currentCard && ttsEnabled) {
            speak(currentCard.question);
        }
    }, [currentCard?.id, ttsEnabled]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't handle shortcuts when goto modal is open
            if (showGotoModal) return;

            if (e.key === " " || e.code === "Space") {
                e.preventDefault();
                if (!isRevealed) {
                    handleReveal();
                }
            } else if (e.key === "ArrowLeft") {
                handlePrev();
            } else if (e.key === "ArrowRight") {
                handleNext();
            } else if (e.key === "g" || e.key === "G") {
                // Open goto modal with 'g' key
                setShowGotoModal(true);
                setGotoInput("");
            } else if (isRevealed) {
                if (e.key === "1") handleRate("Nie umiem");
                else if (e.key === "2") handleRate("W miarę");
                else if (e.key === "3") handleRate("Umiem");
                else if (e.key === "4") handleRate("Opanowane 100%");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isRevealed, playIndex, playOrder, showGotoModal]);

    const handleReveal = useCallback(() => {
        setIsRevealed(true);
        if (currentCard && ttsEnabled) {
            speak(currentCard.answer);
        }
    }, [currentCard, ttsEnabled, speak]);

    const handleRate = useCallback((level: CardLevel) => {
        if (currentCard) {
            updateCardLevel(currentCard.id, level);
        }
        handleNext();
    }, [currentCard, updateCardLevel]);

    const handleNext = useCallback(() => {
        if (!currentDeck) return;

        if (playIndex < playOrder.length - 1) {
            setPlayIndex((prev) => prev + 1);
            setIsRevealed(false);
        } else {
            // End of deck
            if (confirm("End of deck. Restart?")) {
                if (isShuffled) {
                    const shuffled = [...playOrder].sort(() => Math.random() - 0.5);
                    setPlayOrder(shuffled);
                }
                setPlayIndex(0);
                setIsRevealed(false);
            }
        }
    }, [currentDeck, playIndex, playOrder, isShuffled]);

    const handlePrev = useCallback(() => {
        if (playIndex > 0) {
            setPlayIndex((prev) => prev - 1);
            setIsRevealed(false);
        }
    }, [playIndex]);

    const handleShuffle = useCallback(() => {
        if (!currentDeck) return;

        setIsShuffled((prev) => !prev);

        if (!isShuffled) {
            const shuffled = [...playOrder].sort(() => Math.random() - 0.5);
            setPlayOrder(shuffled);
        } else {
            setPlayOrder(currentDeck.cards.map((_, i) => i));
        }
        setPlayIndex(0);
        setIsRevealed(false);
    }, [currentDeck, isShuffled, playOrder]);

    const handleReset = useCallback(() => {
        if (confirm("Reset all progress to 'New'?")) {
            resetCurrentDeck();
        }
    }, [resetCurrentDeck]);

    const handleGoto = useCallback(() => {
        if (!currentDeck) return;

        const targetNum = parseInt(gotoInput, 10);
        if (isNaN(targetNum) || targetNum < 1 || targetNum > currentDeck.cards.length) {
            return;
        }

        // Find the index in playOrder that corresponds to the target card
        const targetIndex = targetNum - 1;
        const playOrderIndex = playOrder.indexOf(targetIndex);

        if (playOrderIndex !== -1) {
            setPlayIndex(playOrderIndex);
        } else {
            // If shuffled and card not at expected position, just go to that index in order
            setPlayIndex(Math.min(targetIndex, playOrder.length - 1));
        }

        setIsRevealed(false);
        setShowGotoModal(false);
        setGotoInput("");
    }, [currentDeck, gotoInput, playOrder]);

    const handleGotoKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleGoto();
        } else if (e.key === "Escape") {
            setShowGotoModal(false);
            setGotoInput("");
        }
    };

    if (!currentDeck || !currentCard) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">No deck selected</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col p-4 md:p-8">
            {/* Go to Question Modal */}
            <AnimatePresence>
                {showGotoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
                        onClick={() => setShowGotoModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-card border border-border rounded-2xl p-6 shadow-xl w-full max-w-sm mx-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-semibold mb-4">Go to Question</h3>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min={1}
                                    max={currentDeck.cards.length}
                                    value={gotoInput}
                                    onChange={(e) => setGotoInput(e.target.value)}
                                    onKeyDown={handleGotoKeyDown}
                                    placeholder={`1 - ${currentDeck.cards.length}`}
                                    autoFocus
                                    className="flex-1 p-3 rounded-lg bg-background border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <Button onClick={handleGoto}>Go</Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                Press Enter to go, Escape to cancel
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Bar */}
            <div className="relative flex justify-between items-center mb-4 max-w-2xl mx-auto w-full">
                <Button variant="ghost" size="icon" onClick={closeDeck}>
                    <X className="w-5 h-5" />
                </Button>

                <button
                    onClick={() => {
                        setShowGotoModal(true);
                        setGotoInput("");
                    }}
                    className="absolute left-1/2 -translate-x-1/2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Go to question (G)"
                >
                    Card {playIndex + 1} / {currentDeck.cards.length}
                </button>

                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setShowGotoModal(true);
                            setGotoInput("");
                        }}
                        title="Go to question (G)"
                    >
                        <Hash className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleShuffle}
                        className={isShuffled ? "text-primary" : ""}
                        title={`Shuffle: ${isShuffled ? "ON" : "OFF"}`}
                    >
                        <Shuffle className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleReset}
                        className="text-destructive"
                        title="Reset Progress"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="max-w-2xl mx-auto w-full mb-6">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all"
                        style={{
                            width: `${((playIndex + 1) / currentDeck.cards.length) * 100}%`,
                        }}
                    />
                </div>
            </div>

            {/* Card Area */}
            <div className="flex-1 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    <FlashcardComponent
                        key={currentCard.id}
                        card={currentCard}
                        deckName={currentDeck.name}
                        isRevealed={isRevealed}
                        onReveal={handleReveal}
                        onRate={handleRate}
                        ttsEnabled={ttsEnabled}
                        onTTSToggle={toggleTTS}
                        onSpeak={speak}
                    />
                </AnimatePresence>
            </div>

            {/* Bottom Navigation - Mobile Friendly */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent md:relative md:bg-transparent md:mt-6">
                <div className="max-w-2xl mx-auto flex justify-between gap-4">
                    <Button
                        variant="outline"
                        onClick={handlePrev}
                        disabled={playIndex === 0}
                        className="flex-1 md:flex-none md:w-32 h-12"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleNext}
                        className="flex-1 md:flex-none md:w-32 h-12"
                    >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>

            {/* Spacer for fixed bottom nav */}
            <div className="h-20 md:hidden" />
        </div>
    );
}
