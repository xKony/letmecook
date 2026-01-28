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
    BarChart3,
    Clock,
    Coffee,
} from "lucide-react";

const ALL_LEVELS: CardLevel[] = ["Nowe", "Nie umiem", "W miarę", "Umiem", "Opanowane 100%"];

const levelColors: Record<CardLevel, { bg: string; text: string; bar: string }> = {
    "Nowe": { bg: "bg-slate-500/20", text: "text-slate-400", bar: "bg-slate-400" },
    "Nie umiem": { bg: "bg-rose-500/20", text: "text-rose-500", bar: "bg-rose-500" },
    "W miarę": { bg: "bg-amber-500/20", text: "text-amber-500", bar: "bg-amber-500" },
    "Umiem": { bg: "bg-emerald-500/20", text: "text-emerald-500", bar: "bg-emerald-500" },
    "Opanowane 100%": { bg: "bg-cyan-500/20", text: "text-cyan-500", bar: "bg-cyan-500" },
};

export function StudySession() {
    const { currentDeck, closeDeck, resetCurrentDeck, updateCardLevel, updateCard } = useApp();
    const { enabled: ttsEnabled, speak, toggle: toggleTTS } = useTTS();

    const [playIndex, setPlayIndex] = useState(0);
    const [isShuffled, setIsShuffled] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);
    const [showGotoModal, setShowGotoModal] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [gotoInput, setGotoInput] = useState("");
    const [activeFilter, setActiveFilter] = useState<CardLevel | null>(null);

    // Session time
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const [showBreakModal, setShowBreakModal] = useState(false);
    const [lastBreakTime, setLastBreakTime] = useState(0);

    // Calculate stats
    const stats = useMemo((): Record<CardLevel, number> => {
        const counts: Record<CardLevel, number> = {
            "Nowe": 0,
            "Nie umiem": 0,
            "W miarę": 0,
            "Umiem": 0,
            "Opanowane 100%": 0,
        };
        if (!currentDeck) return counts;
        currentDeck.cards.forEach((card) => {
            counts[card.level]++;
        });
        return counts;
    }, [currentDeck]);

    const maxCount = useMemo(() => {
        return Math.max(...Object.values(stats), 1);
    }, [stats]);

    // Play order based on filter
    const playOrder = useMemo(() => {
        if (!currentDeck) return [];

        let indices = currentDeck.cards.map((_, i) => i);

        // Apply filter
        if (activeFilter) {
            indices = indices.filter((i) => currentDeck.cards[i].level === activeFilter);
        }

        // Apply shuffle
        if (isShuffled) {
            indices = [...indices].sort(() => Math.random() - 0.5);
        }

        return indices;
    }, [currentDeck, activeFilter, isShuffled]);

    // Reset play index when filter or shuffle changes
    useEffect(() => {
        setPlayIndex(0);
        setIsRevealed(false);
    }, [activeFilter, isShuffled]);

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

    // Session timer
    useEffect(() => {
        const interval = setInterval(() => {
            setSessionSeconds((prev) => {
                const newSeconds = prev + 1;
                // Check for 30-minute break reminder
                const BREAK_INTERVAL = 30 * 60; // 30 minutes in seconds
                if (newSeconds > 0 && newSeconds % BREAK_INTERVAL === 0 && newSeconds !== lastBreakTime) {
                    setShowBreakModal(true);
                    setLastBreakTime(newSeconds);
                }
                return newSeconds;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [lastBreakTime]);

    // Format time as MM:SS or HH:MM:SS
    const formatTime = (seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't handle shortcuts when modals are open
            if (showGotoModal || showStatsModal) return;

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
    }, [isRevealed, playIndex, playOrder, showGotoModal, showStatsModal]);

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
        if (!currentDeck || playOrder.length === 0) return;

        if (playIndex < playOrder.length - 1) {
            setPlayIndex((prev) => prev + 1);
            setIsRevealed(false);
        } else {
            if (confirm("End of deck. Restart?")) {
                setPlayIndex(0);
                setIsRevealed(false);
            }
        }
    }, [currentDeck, playIndex, playOrder]);

    const handlePrev = useCallback(() => {
        if (playIndex > 0) {
            setPlayIndex((prev) => prev - 1);
            setIsRevealed(false);
        }
    }, [playIndex]);

    const handleShuffle = useCallback(() => {
        setIsShuffled((prev) => !prev);
    }, []);

    const handleReset = useCallback(() => {
        if (confirm("Reset all progress to 'New'?")) {
            resetCurrentDeck();
        }
    }, [resetCurrentDeck]);

    const handleGoto = useCallback(() => {
        if (!currentDeck) return;

        const targetNum = parseInt(gotoInput, 10);
        if (isNaN(targetNum) || targetNum < 1 || targetNum > playOrder.length) {
            return;
        }

        setPlayIndex(targetNum - 1);
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

    const handleFilterSelect = (level: CardLevel | null) => {
        setActiveFilter(level);
        setShowStatsModal(false);
    };

    if (!currentDeck) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">No deck selected</p>
            </div>
        );
    }

    if (playOrder.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
                <p className="text-muted-foreground text-center">
                    No cards match the filter "{activeFilter}"
                </p>
                <Button onClick={() => setActiveFilter(null)}>Show All Cards</Button>
                <Button variant="ghost" onClick={closeDeck}>Back to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col p-4 md:p-8">
            {/* Stats Modal */}
            <AnimatePresence>
                {showStatsModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
                        onClick={() => setShowStatsModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-card border border-border rounded-2xl p-6 shadow-xl w-full max-w-md mx-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5" />
                                    Deck Stats
                                </h3>
                                <Button variant="ghost" size="icon" onClick={() => setShowStatsModal(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Stats Bars */}
                            <div className="space-y-3 mb-6">
                                {ALL_LEVELS.map((level) => {
                                    const count = stats[level] || 0;
                                    const percentage = (count / maxCount) * 100;
                                    const isActive = activeFilter === level;

                                    return (
                                        <button
                                            key={level}
                                            onClick={() => handleFilterSelect(level)}
                                            className={`w-full text-left p-3 rounded-xl transition-all ${isActive
                                                ? `${levelColors[level].bg} ring-2 ring-offset-2 ring-offset-background ${levelColors[level].text.replace('text-', 'ring-')}`
                                                : 'hover:bg-muted/50'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <span className={`text-sm font-medium ${levelColors[level].text}`}>
                                                    {level}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    {count} cards
                                                </span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    transition={{ duration: 0.5, delay: 0.1 }}
                                                    className={`h-full rounded-full ${levelColors[level].bar}`}
                                                />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Filter Info */}
                            <div className="border-t border-border pt-4">
                                <p className="text-xs text-muted-foreground mb-3">
                                    Click a level to filter cards
                                </p>
                                <Button
                                    variant={activeFilter === null ? "default" : "outline"}
                                    className="w-full"
                                    onClick={() => handleFilterSelect(null)}
                                >
                                    Show All Cards ({currentDeck.cards.length})
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                                    max={playOrder.length}
                                    value={gotoInput}
                                    onChange={(e) => setGotoInput(e.target.value)}
                                    onKeyDown={handleGotoKeyDown}
                                    placeholder={`1 - ${playOrder.length}`}
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

            {/* Break Reminder Modal */}
            <AnimatePresence>
                {showBreakModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
                        onClick={() => setShowBreakModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-card border border-border rounded-2xl p-8 shadow-xl w-full max-w-sm mx-4 text-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                                <Coffee className="w-8 h-8 text-amber-500" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Time for a Break! ☕</h3>
                            <p className="text-muted-foreground mb-6">
                                You&apos;ve been studying for {formatTime(sessionSeconds)}.
                                Taking a short break helps your brain consolidate what you&apos;ve learned.
                            </p>
                            <div className="flex flex-col gap-2">
                                <Button
                                    onClick={() => setShowBreakModal(false)}
                                    className="w-full"
                                >
                                    Continue Studying
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowBreakModal(false);
                                        closeDeck();
                                    }}
                                >
                                    Take a Break
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Bar */}
            <div className="relative flex justify-between items-center mb-4 max-w-2xl mx-auto w-full h-10">
                {/* Left: Close + Timer */}
                <div className="flex items-center gap-2 z-10">
                    <Button variant="ghost" size="icon" onClick={closeDeck} className="h-10 w-10">
                        <X className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground" title="Session time">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="tabular-nums">{formatTime(sessionSeconds)}</span>
                    </div>
                </div>

                {/* Center: Card counter - absolutely positioned for true centering */}
                <button
                    onClick={() => setShowStatsModal(true)}
                    className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="View stats and filter"
                >
                    {activeFilter && (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${levelColors[activeFilter].bg} ${levelColors[activeFilter].text}`}>
                            {activeFilter}
                        </span>
                    )}
                    <span>Card {playIndex + 1} / {playOrder.length}</span>
                </button>

                {/* Right: Action buttons */}
                <div className="flex items-center gap-1">
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
                            width: `${((playIndex + 1) / playOrder.length) * 100}%`,
                        }}
                    />
                </div>
            </div>

            {/* Card Area */}
            <div className="flex-1 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {currentCard && (
                        <FlashcardComponent
                            key={currentCard.id}
                            card={currentCard}
                            deckName={currentDeck.name}
                            isRevealed={isRevealed}
                            onReveal={handleReveal}
                            onRate={handleRate}
                            onUpdateCard={updateCard}
                            ttsEnabled={ttsEnabled}
                            onTTSToggle={toggleTTS}
                            onSpeak={speak}
                        />
                    )}
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
