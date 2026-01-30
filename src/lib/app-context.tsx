"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { GuestState, Deck, CardLevel } from "@/lib/types";
import {
    loadGuestState,
    saveGuestState,
    createDeck,
    parseQuestionsFile,
    resetDeckProgress,
} from "@/lib/storage";
import { LOCALSTORAGE_SAVE_DEBOUNCE_MS, MAX_DECKS_PER_USER } from "@/lib/constants";

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
    addDeck: (name: string, fileContent: string) => void;
    selectDeck: (deckId: string) => void;
    closeDeck: () => void;
    deleteDeck: (deckId: string) => void;
    renameDeck: (deckId: string, newName: string) => void;
    resetCurrentDeck: () => void;

    // Card actions
    updateCardLevel: (cardId: string, level: CardLevel) => void;
    updateCard: (cardId: string, question: string, answer: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [guestState, setGuestState] = useState<GuestState>({ decks: [] });
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

    // Load guest state from localStorage on mount
    useEffect(() => {
        const loaded = loadGuestState();
        setGuestState(loaded);
        setIsLoading(false);
    }, []);

    // Debounced save to localStorage whenever guest state changes
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isLoading && isGuest) {
            // Clear any pending save
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            // Debounce saves to reduce write frequency
            saveTimeoutRef.current = setTimeout(() => {
                saveGuestState(guestState);
            }, LOCALSTORAGE_SAVE_DEBOUNCE_MS);
        }

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [guestState, isLoading, isGuest]);

    // Get decks (guest mode uses localStorage, authenticated would use DB)
    const decks = useMemo(() => {
        // For now, always use guest state decks
        // TODO: Fetch from DB when authenticated
        return guestState.decks;
    }, [guestState.decks]);

    // Get current deck
    const currentDeck = useMemo(() => {
        if (!currentDeckId) return null;
        return decks.find((d) => d.id === currentDeckId) || null;
    }, [currentDeckId, decks]);

    // Sign out handler
    const handleSignOut = useCallback(() => {
        signOut({ callbackUrl: "/" });
    }, []);

    // Add a new deck
    const addDeck = useCallback((name: string, fileContent: string) => {
        const parsedCards = parseQuestionsFile(fileContent);
        if (parsedCards.length === 0) return;

        const deck = createDeck(name, parsedCards);

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
    }, []);

    // Select a deck
    const selectDeck = useCallback((deckId: string) => {
        setCurrentDeckId(deckId);
    }, []);

    // Close current deck
    const closeDeck = useCallback(() => {
        setCurrentDeckId(null);
    }, []);

    // Delete a deck
    const deleteDeck = useCallback((deckId: string) => {
        setGuestState((prev) => ({
            ...prev,
            decks: prev.decks.filter((d) => d.id !== deckId),
        }));
        if (currentDeckId === deckId) {
            setCurrentDeckId(null);
        }
    }, [currentDeckId]);

    // Rename a deck
    const renameDeck = useCallback((deckId: string, newName: string) => {
        setGuestState((prev) => ({
            ...prev,
            decks: prev.decks.map((d) =>
                d.id === deckId ? { ...d, name: newName, updatedAt: Date.now() } : d
            ),
        }));
    }, []);

    // Reset current deck progress
    const resetCurrentDeck = useCallback(() => {
        if (!currentDeckId) return;

        setGuestState((prev) => ({
            ...prev,
            decks: prev.decks.map((d) =>
                d.id === currentDeckId ? resetDeckProgress(d) : d
            ),
        }));
    }, [currentDeckId]);

    // Update a single card's level
    const updateCardLevel = useCallback((cardId: string, level: CardLevel) => {
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
    }, []);

    // Update a single card's question and answer
    const updateCard = useCallback((cardId: string, question: string, answer: string) => {
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
    }, []);

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
