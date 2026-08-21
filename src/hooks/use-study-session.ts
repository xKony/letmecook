"use client";

import { useState, useEffect, useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import { CardLevel, Flashcard, Deck } from "@/lib/types";

/**
 * Custom hook to manage the core logic of a study session.
 * 
 * @param deck The current deck being studied.
 * @returns An object containing the play order, current index, current card, and session actions.
 */
export function useStudySession(deck: Deck | null) {
    const [playIndex, setPlayIndex] = useState(0);
    const [isShuffled, setIsShuffled] = useState(false);
    const [activeFilter, setActiveFilter] = useState<CardLevel | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [shuffleSeed, setShuffleSeed] = useState(0);

    /**
     * Fisher-Yates shuffle algorithm to randomize the play order.
     */
    const fisherYatesShuffle = useCallback(<T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }, []);

    /**
     * The stable play order derived from the deck, filter, and shuffle state.
     */
    const playOrder = useMemo(() => {
        if (!deck) return [];

        let filteredCards = deck.cards;
        if (activeFilter) {
            filteredCards = deck.cards.filter(c => c.level === activeFilter);
        }

        let cardIds = filteredCards.map(c => c.id);

        if (isShuffled) {
            // shuffleSeed is used to trigger a re-run of this memo even if other deps don't change
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            shuffleSeed;
            cardIds = fisherYatesShuffle(cardIds);
        }

        return cardIds;
    }, [deck, activeFilter, isShuffled, shuffleSeed, fisherYatesShuffle]);

    // Adjust state during render when play order changes
    // This is the recommended way to sync state from other state/props during render
    const playOrderKey = `${deck?.id ?? ""}|${activeFilter ?? ""}|${isShuffled}|${shuffleSeed}`;
    const [prevPlayOrderKey, setPrevPlayOrderKey] = useState(playOrderKey);

    if (playOrderKey !== prevPlayOrderKey) {
        setPrevPlayOrderKey(playOrderKey);
        setPlayIndex(0);
        setIsRevealed(false);
    }

    /**
     * Find a card by ID within the current deck.
     */
    const getCardById = useCallback((cardId: string): Flashcard | null => {
        if (!deck) return null;
        return deck.cards.find(c => c.id === cardId) || null;
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

    const restart = useCallback(() => {
        setShuffleSeed((prev) => prev + 1);
        setPlayIndex(0);
        setIsRevealed(false);
    }, []);

    return {
        playIndex,
        playOrder,
        currentCard,
        isShuffled,
        activeFilter,
        isRevealed,
        stats,
        maxCount,
        setPlayIndex,
        setIsRevealed,
        setActiveFilter,
        handleNext,
        handlePrev,
        handleShuffle,
        handleGoto,
        restart,
    };
}

/**
 * Custom hook to manage the study session timer and break reminders.
 * The ticking lives in a ref so per-second updates do not re-render the caller;
 * leaf components subscribe via `useSessionSeconds`.
 *
 * @param breakIntervalSeconds Interval in seconds after which a break reminder should be shown.
 * @returns Break reminder state plus stable accessors for reading/subscribing to the timer.
 */
export function useSessionTimer(breakIntervalSeconds: number) {
    const secondsRef = useRef(0);
    const lastBreakTimeRef = useRef(0);
    const [showBreakModal, setShowBreakModal] = useState(false);
    const listenersRef = useRef(new Set<() => void>());

    useEffect(() => {
        const interval = setInterval(() => {
            secondsRef.current += 1;
            const newSeconds = secondsRef.current;
            if (newSeconds > 0 && newSeconds % breakIntervalSeconds === 0 && newSeconds !== lastBreakTimeRef.current) {
                lastBreakTimeRef.current = newSeconds;
                setShowBreakModal(true);
            }
            listenersRef.current.forEach((listener) => listener());
        }, 1000);

        return () => clearInterval(interval);
    }, [breakIntervalSeconds]);

    /**
     * Subscribe a listener to per-second timer ticks without re-rendering the subscriber.
     */
    const subscribeToSeconds = useCallback((listener: () => void) => {
        listenersRef.current.add(listener);
        return () => {
            listenersRef.current.delete(listener);
        };
    }, []);

    /**
     * Read the current session duration in seconds (non-reactive).
     */
    const getSeconds = useCallback(() => secondsRef.current, []);

    /**
     * Format seconds into a human-readable duration (MM:SS or HH:MM:SS).
     */
    const formatTime = useCallback((s: number): string => {
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = s % 60;

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    return {
        subscribeToSeconds,
        getSeconds,
        showBreakModal,
        setShowBreakModal,
        formatTime,
    };
}

/**
 * Subscribe to the session timer and return the formatted duration.
 * Intended for small leaf components so only the time text re-renders each second.
 *
 * @param subscribeToSeconds Subscribe function from `useSessionTimer`.
 * @param getSeconds Non-reactive reader from `useSessionTimer`.
 * @param formatTime Formatter from `useSessionTimer`.
 * @returns The formatted session duration, updated every second.
 */
export function useSessionSeconds(
    subscribeToSeconds: (listener: () => void) => () => void,
    getSeconds: () => number,
    formatTime: (s: number) => string
): string {
    const getSnapshot = useCallback(() => formatTime(getSeconds()), [formatTime, getSeconds]);
    return useSyncExternalStore(subscribeToSeconds, getSnapshot);
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
    const actionsRef = useRef(actions);

    useEffect(() => {
        actionsRef.current = actions;
    });

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
                    actionsRef.current.onReveal();
                }
            } else if (e.key === "ArrowLeft") {
                actionsRef.current.onPrev();
            } else if (e.key === "ArrowRight") {
                actionsRef.current.onNext();
            } else if (e.key === "g" || e.key === "G") {
                actionsRef.current.onShowGoto();
            } else if (isRevealed) {
                if (e.key === "1") actionsRef.current.onRate("Nie umiem");
                else if (e.key === "2") actionsRef.current.onRate("W miarę");
                else if (e.key === "3") actionsRef.current.onRate("Umiem");
                else if (e.key === "4") actionsRef.current.onRate("Opanowane 100%");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isRevealed, isDisabled]);
}
