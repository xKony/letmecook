"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import {
    AppState,
    Deck,
    Flashcard,
    UserProfile,
    CardLevel,
} from "@/lib/types";
import {
    loadAppState,
    saveAppState,
    createUser,
    createDeck,
    parseQuestionsFile,
    resetDeckProgress,
    generateId,
} from "@/lib/storage";

interface AppContextType {
    // State
    state: AppState;
    currentUser: UserProfile | null;
    currentDeck: Deck | null;
    isLoading: boolean;

    // User actions
    addUser: (name: string) => void;
    selectUser: (userId: string) => void;
    logout: () => void;

    // Deck actions
    getUserDecks: () => Deck[];
    addDeck: (name: string, fileContent: string) => void;
    selectDeck: (deckId: string) => void;
    closeDeck: () => void;
    deleteDeck: (deckId: string) => void;
    resetCurrentDeck: () => void;

    // Card actions
    updateCardLevel: (cardId: string, level: CardLevel) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AppState>(() => ({
        currentUserId: null,
        users: [],
        decks: {},
    }));
    const [currentDeckId, setCurrentDeckId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load state from localStorage on mount
    useEffect(() => {
        const loaded = loadAppState();
        setState(loaded);
        setIsLoading(false);
    }, []);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        if (!isLoading) {
            saveAppState(state);
        }
    }, [state, isLoading]);

    // Get current user
    const currentUser = useMemo(() => {
        if (!state.currentUserId) return null;
        return state.users.find((u) => u.id === state.currentUserId) || null;
    }, [state.currentUserId, state.users]);

    // Get current deck
    const currentDeck = useMemo(() => {
        if (!currentDeckId || !state.currentUserId) return null;
        const userDecks = state.decks[state.currentUserId] || [];
        return userDecks.find((d) => d.id === currentDeckId) || null;
    }, [currentDeckId, state.currentUserId, state.decks]);

    // Add a new user
    const addUser = useCallback((name: string) => {
        const user = createUser(name);
        setState((prev) => ({
            ...prev,
            users: [...prev.users, user],
            currentUserId: user.id,
            decks: { ...prev.decks, [user.id]: [] },
        }));
    }, []);

    // Select a user
    const selectUser = useCallback((userId: string) => {
        setState((prev) => ({
            ...prev,
            currentUserId: userId,
        }));
        setCurrentDeckId(null);
    }, []);

    // Logout
    const logout = useCallback(() => {
        setState((prev) => ({
            ...prev,
            currentUserId: null,
        }));
        setCurrentDeckId(null);
    }, []);

    // Get decks for current user
    const getUserDecks = useCallback(() => {
        if (!state.currentUserId) return [];
        return state.decks[state.currentUserId] || [];
    }, [state.currentUserId, state.decks]);

    // Add a new deck
    const addDeck = useCallback((name: string, fileContent: string) => {
        if (!state.currentUserId) return;

        const parsedCards = parseQuestionsFile(fileContent);
        if (parsedCards.length === 0) return;

        const deck = createDeck(name, parsedCards);

        setState((prev) => {
            const userDecks = prev.decks[prev.currentUserId!] || [];
            // Limit to 5 decks per user
            if (userDecks.length >= 5) {
                alert("Maximum 5 decks per user reached.");
                return prev;
            }
            return {
                ...prev,
                decks: {
                    ...prev.decks,
                    [prev.currentUserId!]: [...userDecks, deck],
                },
            };
        });
    }, [state.currentUserId]);

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
        if (!state.currentUserId) return;

        setState((prev) => {
            const userDecks = prev.decks[prev.currentUserId!] || [];
            return {
                ...prev,
                decks: {
                    ...prev.decks,
                    [prev.currentUserId!]: userDecks.filter((d) => d.id !== deckId),
                },
            };
        });

        if (currentDeckId === deckId) {
            setCurrentDeckId(null);
        }
    }, [state.currentUserId, currentDeckId]);

    // Reset current deck progress
    const resetCurrentDeck = useCallback(() => {
        if (!state.currentUserId || !currentDeckId) return;

        setState((prev) => {
            const userDecks = prev.decks[prev.currentUserId!] || [];
            return {
                ...prev,
                decks: {
                    ...prev.decks,
                    [prev.currentUserId!]: userDecks.map((d) =>
                        d.id === currentDeckId ? resetDeckProgress(d) : d
                    ),
                },
            };
        });
    }, [state.currentUserId, currentDeckId]);

    // Update card level
    const updateCardLevel = useCallback((cardId: string, level: CardLevel) => {
        if (!state.currentUserId || !currentDeckId) return;

        setState((prev) => {
            const userDecks = prev.decks[prev.currentUserId!] || [];
            return {
                ...prev,
                decks: {
                    ...prev.decks,
                    [prev.currentUserId!]: userDecks.map((deck) => {
                        if (deck.id !== currentDeckId) return deck;
                        return {
                            ...deck,
                            cards: deck.cards.map((card) =>
                                card.id === cardId ? { ...card, level } : card
                            ),
                            updatedAt: Date.now(),
                        };
                    }),
                },
            };
        });
    }, [state.currentUserId, currentDeckId]);

    const value: AppContextType = {
        state,
        currentUser,
        currentDeck,
        isLoading,
        addUser,
        selectUser,
        logout,
        getUserDecks,
        addDeck,
        selectDeck,
        closeDeck,
        deleteDeck,
        resetCurrentDeck,
        updateCardLevel,
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
