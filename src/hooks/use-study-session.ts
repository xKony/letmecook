"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { CardLevel, Flashcard, Deck } from "@/lib/types";

/**
 * Custom hook to manage the core logic of a study session.
 *
 * @param deck The current deck being studied.
 * @returns An object containing the play order, current index, current card, and session actions.
 */
function cardMatchesSearch(card: Flashcard, query: string): boolean {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return true;
    return (
        card.question.toLowerCase().includes(normalized) ||
        card.answer.toLowerCase().includes(normalized)
    );
}

function getFilteredCardIds(deck: Deck, activeFilter: CardLevel | null): string[] {
    const cards = activeFilter
        ? deck.cards.filter((c) => c.level === activeFilter)
        : deck.cards;
    return cards.map((c) => c.id);
}

function fisherYatesShuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function useStudySession(deck: Deck | null) {
    const [playIndex, setPlayIndex] = useState(0);
    const [playOrder, setPlayOrder] = useState<string[]>([]);
    const [isShuffled, setIsShuffled] = useState(false);
    const [activeFilter, setActiveFilter] = useState<CardLevel | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isRevealed, setIsRevealed] = useState(false);
    const [shuffleSeed, setShuffleSeed] = useState(0);

    const filteredCardIds = useMemo(() => {
        if (!deck) return [];
        return getFilteredCardIds(deck, activeFilter);
    }, [deck, activeFilter]);

    const filteredCards = useMemo(() => {
        if (!deck) return [];
        const idSet = new Set(filteredCardIds);
        return deck.cards.filter((c) => idSet.has(c.id));
    }, [deck, filteredCardIds]);

    const searchResults = useMemo(() => {
        if (!deck || !searchQuery.trim()) return [];
        return filteredCards.filter((c) => cardMatchesSearch(c, searchQuery));
    }, [deck, filteredCards, searchQuery]);

    // Rebuild play order only when deck, filter, or shuffle mode changes — not on card level updates.
    const playOrderContextRef = useRef({
        deckId: "",
        filter: null as CardLevel | null,
        shuffled: false,
        seed: 0,
    });
    const playOrderRef = useRef(playOrder);
    const playIndexRef = useRef(playIndex);
    playOrderRef.current = playOrder;
    playIndexRef.current = playIndex;

    useEffect(() => {
        if (!deck) {
            setPlayOrder([]);
            setPlayIndex(0);
            return;
        }

        const ctx = playOrderContextRef.current;
        const contextChanged =
            ctx.deckId !== deck.id ||
            ctx.filter !== activeFilter ||
            ctx.shuffled !== isShuffled ||
            ctx.seed !== shuffleSeed;

        if (!contextChanged) return;

        let order = getFilteredCardIds(deck, activeFilter);
        if (isShuffled) {
            order = fisherYatesShuffle(order);
        }

        setPlayOrder(order);
        setPlayIndex(0);
        setIsRevealed(false);
        playOrderContextRef.current = {
            deckId: deck.id,
            filter: activeFilter,
            shuffled: isShuffled,
            seed: shuffleSeed,
        };
    }, [deck, activeFilter, isShuffled, shuffleSeed]);

    /**
     * Find a card by ID within the current deck.
     */
    const getCardById = useCallback((cardId: string): Flashcard | null => {
        if (!deck) return null;
        return deck.cards.find((c) => c.id === cardId) || null;
    }, [deck]);

    /**
     * The card currently being studied.
     */
    const currentCard = useMemo(() => {
        if (playOrder.length === 0) return null;
        const cardId = playOrder[playIndex];
        return getCardById(cardId);
    }, [playOrder, playIndex, getCardById]);

    /**
     * Session-wide stats based on card levels.
     */
    const stats = useMemo((): Record<CardLevel, number> => {
        const counts: Record<CardLevel, number> = {
            "Nowe": 0,
            "Nie umiem": 0,
            "W miarę": 0,
            "Umiem": 0,
            "Opanowane 100%": 0,
        };
        if (!deck) return counts;
        deck.cards.forEach((card) => {
            counts[card.level]++;
        });
        return counts;
    }, [deck]);

    /**
     * The maximum count among all levels, used for scaling stats bars.
     */
    const maxCount = useMemo(() => {
        return Math.max(...Object.values(stats), 1);
    }, [stats]);

    const handleNext = useCallback((onSessionEnd?: () => void) => {
        if (!deck || playOrder.length === 0) return;

        if (playIndex < playOrder.length - 1) {
            setPlayIndex((prev) => prev + 1);
            setIsRevealed(false);
        } else {
            onSessionEnd?.();
        }
    }, [deck, playIndex, playOrder.length]);

    const handlePrev = useCallback(() => {
        if (playIndex > 0) {
            setPlayIndex((prev) => prev - 1);
            setIsRevealed(false);
        }
    }, [playIndex]);

    const handleShuffle = useCallback(() => {
        setIsShuffled((prev) => !prev);
        setShuffleSeed((prev) => prev + 1);
    }, []);

    const handleGoto = useCallback((index: number) => {
        if (index >= 0 && index < playOrder.length) {
            setPlayIndex(index);
            setIsRevealed(false);
            return true;
        }
        return false;
    }, [playOrder.length]);

    const handleGotoByCardId = useCallback((cardId: string) => {
        const index = playOrder.indexOf(cardId);
        if (index >= 0) {
            setPlayIndex(index);
            setIsRevealed(false);
            return true;
        }
        return false;
    }, [playOrder]);

    /**
     * Advance after rating: keeps shuffle stable and handles cards leaving an active filter.
     */
    const advanceAfterRating = useCallback(
        (cardId: string, newLevel: CardLevel, onSessionEnd?: () => void) => {
            const leavesFilter = activeFilter !== null && newLevel !== activeFilter;
            const prevOrder = playOrderRef.current;
            const prevIndex = playIndexRef.current;
            const nextOrder = leavesFilter
                ? prevOrder.filter((id) => id !== cardId)
                : prevOrder;

            let nextIndex: number;
            if (nextOrder.length === 0) {
                nextIndex = 0;
                onSessionEnd?.();
            } else if (leavesFilter) {
                nextIndex = Math.min(prevIndex, nextOrder.length - 1);
            } else if (prevIndex < nextOrder.length - 1) {
                nextIndex = prevIndex + 1;
            } else {
                nextIndex = prevIndex;
                onSessionEnd?.();
            }

            setPlayOrder(nextOrder);
            setPlayIndex(nextIndex);
            setIsRevealed(false);
        },
        [activeFilter]
    );

    const clearFilters = useCallback(() => {
        setActiveFilter(null);
        setSearchQuery("");
    }, []);

    const restart = useCallback(() => {
        setShuffleSeed((prev) => prev + 1);
        setPlayIndex(0);
        setIsRevealed(false);
    }, []);

    return {
        playIndex,
        playOrder,
        filteredCards,
        searchResults,
        currentCard,
        isShuffled,
        activeFilter,
        searchQuery,
        isRevealed,
        stats,
        maxCount,
        setPlayIndex,
        setIsRevealed,
        setActiveFilter,
        setSearchQuery,
        clearFilters,
        handleNext,
        handlePrev,
        handleShuffle,
        handleGoto,
        handleGotoByCardId,
        advanceAfterRating,
        restart,
    };
}

/**
 * Custom hook to manage the study session timer and break reminders.
 *
 * @param breakIntervalSeconds Interval in seconds after which a break reminder should be shown.
 * @returns An object containing the session duration and actions for break reminders.
 */
export function useSessionTimer(breakIntervalSeconds: number) {
    const [seconds, setSeconds] = useState(0);
    const [showBreakModal, setShowBreakModal] = useState(false);
    const [lastBreakTime, setLastBreakTime] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds((prev) => {
                const newSeconds = prev + 1;
                if (newSeconds > 0 && newSeconds % breakIntervalSeconds === 0 && newSeconds !== lastBreakTime) {
                    setShowBreakModal(true);
                    setLastBreakTime(newSeconds);
                }
                return newSeconds;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [breakIntervalSeconds, lastBreakTime]);

    /**
     * Format seconds into a human-readable duration (MM:SS or HH:MM:SS).
     */
    const formatTime = useCallback((s: number): string => {
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = s % 60;

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }, []);

    return {
        seconds,
        showBreakModal,
        setShowBreakModal,
        formatTime,
    };
}

interface ShortcutActions {
    onReveal: () => void;
    onNext: () => void;
    onPrev: () => void;
    onRate: (level: CardLevel) => void;
    onShowGoto: () => void;
}

/**
 * Custom hook to manage keyboard shortcuts during a study session.
 *
 * @param isRevealed Whether the current card is revealed.
 * @param isDisabled Whether shortcuts should be disabled (e.g., when a modal is open).
 * @param actions Callback actions triggered by shortcuts.
 */
export function useSessionShortcuts(
    isRevealed: boolean,
    isDisabled: boolean,
    actions: ShortcutActions
) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isDisabled) return;

            const target = e.target as HTMLElement;
            if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
                return;
            }

            if (e.key === " " || e.code === "Space") {
                e.preventDefault();
                if (!isRevealed) {
                    actions.onReveal();
                }
            } else if (e.key === "ArrowLeft") {
                actions.onPrev();
            } else if (e.key === "ArrowRight") {
                actions.onNext();
            } else if (e.key === "g" || e.key === "G") {
                actions.onShowGoto();
            } else if (isRevealed) {
                if (e.key === "1") actions.onRate("Nie umiem");
                else if (e.key === "2") actions.onRate("W miarę");
                else if (e.key === "3") actions.onRate("Umiem");
                else if (e.key === "4") actions.onRate("Opanowane 100%");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isRevealed, isDisabled, actions]);
}
