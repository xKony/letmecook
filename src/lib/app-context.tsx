"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { GuestState, Deck, CardLevel, Flashcard } from "@/lib/types";
import {
    loadGuestState,
    saveGuestState,
    createDeck as createLocalDeck,
    parseQuestionsFile,
    resetDeckProgress as resetLocalDeckProgress,
} from "@/lib/storage";
import { LOCALSTORAGE_SAVE_DEBOUNCE_MS, MAX_DECKS_PER_USER } from "@/lib/constants";

// Server actions for authenticated users
import { getMyDecks, createDeck as createDbDeck, deleteDeck as deleteDbDeck, updateDeck as updateDbDeck } from "@/app/actions/deck-actions";
import { updateCardLevel as updateDbCardLevel, updateCard as updateDbCard, resetDeckProgress as resetDbDeckProgress } from "@/app/actions/card-actions";

interface AppContextType {
    // Auth state
    isAuthenticated: boolean;
    isGuest: boolean;
    isAdmin: boolean;
    authUser: { id: string; email: string; name?: string | null } | null;
    authLoading: boolean;

    // App state
    decks: Deck[];
    currentDeck: Deck | null;
    isLoading: boolean;

    // Auth actions
    handleSignOut: () => void;

    // Deck actions
    addDeck: (name: string, content: string | { question: string, answer: string }[]) => void;
    selectDeck: (deckId: string) => void;
    closeDeck: () => void;
    deleteDeck: (deckId: string) => void;
    renameDeck: (deckId: string, newName: string) => void;
    resetCurrentDeck: () => void;
    refreshDecks: () => Promise<void>;

    // Card actions
    updateCardLevel: (cardId: string, level: CardLevel) => void;
    updateCard: (cardId: string, question: string, answer: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

// Helper to transform DB deck to local Deck type
function transformDbDeck(dbDeck: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    flashcards: {
        id: string;
        question: string;
        answer: string;
        level: string;
    }[];
}): Deck {
    return {
        id: dbDeck.id,
        name: dbDeck.name,
        createdAt: dbDeck.createdAt.getTime(),
        updatedAt: dbDeck.updatedAt.getTime(),
        cards: dbDeck.flashcards.map((card) => ({
            id: card.id,
            question: card.question,
            answer: card.answer,
            level: card.level as CardLevel,
        })),
    };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [guestState, setGuestState] = useState<GuestState>({ decks: [] });
    const [dbDecks, setDbDecks] = useState<Deck[]>([]);
    const [currentDeckId, setCurrentDeckId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Auth state derived from session
    const authLoading = status === "loading";
    const isAuthenticated = status === "authenticated" && !!session?.user;
    const isGuest = !isAuthenticated;
    const isAdmin = (session?.user as { isAdmin?: boolean } | undefined)?.isAdmin ?? false;
    const authUser = session?.user ? {
        id: session.user.id || "",
        email: session.user.email || "",
        name: session.user.name,
    } : null;

    // Load data based on auth state
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                if (isAuthenticated) {
                    // Fetch decks from database
                    const decks = await getMyDecks();
                    setDbDecks(decks.map(transformDbDeck));
                } else if (!authLoading) {
                    // Load from localStorage for guests
                    const loaded = loadGuestState();
                    setGuestState(loaded);
                }
            } catch (error) {
                console.error("Failed to load decks:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (!authLoading) {
            loadData();
        }
    }, [isAuthenticated, authLoading]);

    // Debounced save to localStorage for guests
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isLoading && isGuest && !authLoading) {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            saveTimeoutRef.current = setTimeout(() => {
                saveGuestState(guestState);
            }, LOCALSTORAGE_SAVE_DEBOUNCE_MS);
        }

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [guestState, isLoading, isGuest, authLoading]);

    // Get decks based on auth state
    const decks = useMemo(() => {
        return isAuthenticated ? dbDecks : guestState.decks;
    }, [isAuthenticated, dbDecks, guestState.decks]);

    // Get current deck
    const currentDeck = useMemo(() => {
        if (!currentDeckId) return null;
        return decks.find((d) => d.id === currentDeckId) || null;
    }, [currentDeckId, decks]);

    // Refresh decks from database (for authenticated users)
    const refreshDecks = useCallback(async () => {
        if (isAuthenticated) {
            try {
                const freshDecks = await getMyDecks();
                setDbDecks(freshDecks.map(transformDbDeck));
            } catch (error) {
                console.error("Failed to refresh decks:", error);
            }
        }
    }, [isAuthenticated]);

    // Sign out handler
    const handleSignOut = useCallback(() => {
        signOut({ callbackUrl: "/" });
    }, []);

    // Add a new deck
    const addDeck = useCallback(async (name: string, content: string | { question: string, answer: string }[]) => {
        let parsedCards: { question: string; answer: string }[] = [];

        if (typeof content === "string") {
            parsedCards = parseQuestionsFile(content);
        } else {
            parsedCards = content;
        }

        if (parsedCards.length === 0) return;

        if (isAuthenticated) {
            // Save to database
            try {
                await createDbDeck(name, parsedCards);
                await refreshDecks();
            } catch (error) {
                console.error("Failed to create deck:", error);
                // Show specific error if available
                alert(error instanceof Error ? error.message : "Failed to create deck. Please try again.");
            }
        } else {
            // Save to localStorage
            const deck = createLocalDeck(name, parsedCards);
            setGuestState((prev) => {
                if (prev.decks.length >= MAX_DECKS_PER_USER) {
                    alert(`Maximum ${MAX_DECKS_PER_USER} decks reached.`);
                    return prev;
                }
                return {
                    ...prev,
                    decks: [...prev.decks, deck],
                };
            });
        }
    }, [isAuthenticated, refreshDecks]);

    // Select a deck
    const selectDeck = useCallback((deckId: string) => {
        setCurrentDeckId(deckId);
    }, []);

    // Close current deck
    const closeDeck = useCallback(() => {
        setCurrentDeckId(null);
    }, []);

    // Delete a deck
    const deleteDeck = useCallback(async (deckId: string) => {
        if (isAuthenticated) {
            try {
                await deleteDbDeck(deckId);
                // Immediately update local state
                setDbDecks((prev) => prev.filter((d) => d.id !== deckId));
            } catch (error) {
                console.error("Failed to delete deck:", error);
                alert("Failed to delete deck. Please try again.");
            }
        } else {
            setGuestState((prev) => ({
                ...prev,
                decks: prev.decks.filter((d) => d.id !== deckId),
            }));
        }

        if (currentDeckId === deckId) {
            setCurrentDeckId(null);
        }
    }, [isAuthenticated, currentDeckId]);

    // Rename a deck
    const renameDeck = useCallback(async (deckId: string, newName: string) => {
        if (isAuthenticated) {
            try {
                await updateDbDeck(deckId, { name: newName });
                // Immediately update local state
                setDbDecks((prev) => prev.map((d) =>
                    d.id === deckId ? { ...d, name: newName, updatedAt: Date.now() } : d
                ));
            } catch (error) {
                console.error("Failed to rename deck:", error);
            }
        } else {
            setGuestState((prev) => ({
                ...prev,
                decks: prev.decks.map((d) =>
                    d.id === deckId ? { ...d, name: newName, updatedAt: Date.now() } : d
                ),
            }));
        }
    }, [isAuthenticated]);

    // Reset current deck progress
    const resetCurrentDeck = useCallback(async () => {
        if (!currentDeckId) return;

        if (isAuthenticated) {
            try {
                await resetDbDeckProgress(currentDeckId);
                // Immediately update local state
                setDbDecks((prev) => prev.map((d) =>
                    d.id === currentDeckId
                        ? { ...d, cards: d.cards.map((c) => ({ ...c, level: "Nowe" as CardLevel })), updatedAt: Date.now() }
                        : d
                ));
            } catch (error) {
                console.error("Failed to reset deck:", error);
            }
        } else {
            setGuestState((prev) => ({
                ...prev,
                decks: prev.decks.map((d) =>
                    d.id === currentDeckId ? resetLocalDeckProgress(d) : d
                ),
            }));
        }
    }, [currentDeckId, isAuthenticated]);

    // Update a single card's level
    const updateCardLevel = useCallback(async (cardId: string, level: CardLevel) => {
        if (isAuthenticated) {
            try {
                await updateDbCardLevel(cardId, level);
                // Immediately update local state for responsiveness
                setDbDecks((prev) => prev.map((deck) => ({
                    ...deck,
                    cards: deck.cards.map((card) =>
                        card.id === cardId ? { ...card, level } : card
                    ),
                    updatedAt: deck.cards.some((c) => c.id === cardId) ? Date.now() : deck.updatedAt,
                })));
            } catch (error) {
                console.error("Failed to update card level:", error);
            }
        } else {
            setGuestState((prev) => ({
                ...prev,
                decks: prev.decks.map((deck) => ({
                    ...deck,
                    cards: deck.cards.map((card) =>
                        card.id === cardId ? { ...card, level } : card
                    ),
                    updatedAt: deck.cards.some((c) => c.id === cardId) ? Date.now() : deck.updatedAt,
                })),
            }));
        }
    }, [isAuthenticated]);

    // Update a single card's question and answer
    const updateCard = useCallback(async (cardId: string, question: string, answer: string) => {
        if (isAuthenticated) {
            try {
                await updateDbCard(cardId, question, answer);
                // Immediately update local state
                setDbDecks((prev) => prev.map((deck) => ({
                    ...deck,
                    cards: deck.cards.map((card) =>
                        card.id === cardId ? { ...card, question, answer } : card
                    ),
                    updatedAt: deck.cards.some((c) => c.id === cardId) ? Date.now() : deck.updatedAt,
                })));
            } catch (error) {
                console.error("Failed to update card:", error);
            }
        } else {
            setGuestState((prev) => ({
                ...prev,
                decks: prev.decks.map((deck) => ({
                    ...deck,
                    cards: deck.cards.map((card) =>
                        card.id === cardId ? { ...card, question, answer } : card
                    ),
                    updatedAt: deck.cards.some((c) => c.id === cardId) ? Date.now() : deck.updatedAt,
                })),
            }));
        }
    }, [isAuthenticated]);

    const value: AppContextType = {
        isAuthenticated,
        isGuest,
        isAdmin,
        authUser,
        authLoading,
        decks,
        currentDeck,
        isLoading,
        handleSignOut,
        addDeck,
        selectDeck,
        closeDeck,
        deleteDeck,
        renameDeck,
        resetCurrentDeck,
        refreshDecks,
        updateCardLevel,
        updateCard,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useApp must be used within AppProvider");
    }
    return context;
}
