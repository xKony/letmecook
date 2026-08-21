"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { GuestState, Deck, CardLevel, EditableCard, Flashcard } from "@/lib/types";
import {
    loadGuestState,
    saveGuestState,
    createDeck as createLocalDeck,
    parseQuestionsFile,
    resetDeckProgress as resetLocalDeckProgress,
    generateId,
} from "@/lib/storage";
import { LOCALSTORAGE_SAVE_DEBOUNCE_MS, MAX_DECKS_PER_USER } from "@/lib/constants";

// Server actions for authenticated users
import { getMyDecks, getUserMaxDecks, createDeck as createDbDeck, deleteDeck as deleteDbDeck, updateDeck as updateDbDeck } from "@/app/actions/deck-actions";
import { updateCardLevel as updateDbCardLevel, updateCard as updateDbCard, resetDeckProgress as resetDbDeckProgress, syncDeckCards as syncDbDeckCards } from "@/app/actions/card-actions";
import { transformDbDeck } from "@/lib/utils";
import { normalizeDeckCards } from "@/lib/flashcard-order";

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
    maxDecks: number;

    // Data sync
    setInitialData: (decks: Deck[], maxDecks: number) => void;

    // Auth actions
    handleSignOut: () => void;

    // Deck actions
    addDeck: (name: string, content: string | { question: string; answer: string; image?: string }[]) => void;
    selectDeck: (deckId: string) => void;
    closeDeck: () => void;
    deleteDeck: (deckId: string) => void;
    renameDeck: (deckId: string, newName: string) => void;
    resetCurrentDeck: () => void;
    refreshDecks: () => Promise<void>;

    // Card actions
    updateCardLevel: (cardId: string, level: CardLevel) => void;
    updateCard: (cardId: string, question: string, answer: string, image?: string) => void;
    syncDeckCards: (deckId: string, cards: EditableCard[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({
    children,
    initialDecks = [],
    initialMaxDecks = MAX_DECKS_PER_USER,
    initialSession = null
}: {
    children: React.ReactNode,
    initialDecks?: Deck[],
    initialMaxDecks?: number,
    initialSession?: Session | null
}) {
    // Use useSession as the source of truth for client-side auth state
    const { data: session, status } = useSession();
    
    // Use server-side data as initial state to avoid loading spinners
    const [dbDecks, setDbDecks] = useState<Deck[]>(initialDecks);
    const [maxDecks, setMaxDecks] = useState(initialMaxDecks);
    
    const [guestState, setGuestState] = useState<GuestState>({ decks: [] });
    const [currentDeckId, setCurrentDeckId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false); // Start as NOT loading if we have server data
    const hasInitializedAuthData = useRef(false);

    // Auth state derived from session or initialSession
    const currentSession = session || initialSession;

    // Derived values should be calculated during render, not in effects
    const isAuthenticated = useMemo(() => !!currentSession?.user, [currentSession]);
    const isGuest = useMemo(() => !isAuthenticated, [isAuthenticated]);
    const isAdmin = useMemo(() => (currentSession?.user as { isAdmin?: boolean } | undefined)?.isAdmin ?? false, [currentSession]);
    const authUser = useMemo(() => currentSession?.user ? {
        id: currentSession.user.id || "",
        email: currentSession.user.email || "",
        name: currentSession.user.name,
    } : null, [currentSession]);

    // Use a ref for authLoading to avoid unnecessary re-renders if we already have initial data
    const authLoading = status === "loading" && !initialSession;

    // Sync with database if session changes and we don't have data yet
    useEffect(() => {
        if (isAuthenticated && !hasInitializedAuthData.current && dbDecks.length === 0 && !initialDecks.length) {
            const loadData = async () => {
                setIsLoading(true);
                try {
                    const decks = await getMyDecks();
                    setDbDecks(decks.map(transformDbDeck));
                    const userMaxDecks = await getUserMaxDecks();
                    setMaxDecks(userMaxDecks);
                    hasInitializedAuthData.current = true;
                } catch (error) {
                    console.error("Failed to load decks:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            loadData();
        } else if (isGuest && !authLoading) {
            // Always load guest state from local storage on mount
            const loaded = loadGuestState();
            setGuestState(loaded);
        }
    }, [isAuthenticated, isGuest, authLoading, initialDecks.length, dbDecks.length]);

    // Debounced save to localStorage for guests
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (isGuest && !authLoading) {
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
    }, [guestState, isGuest, authLoading]);

    // Get decks based on auth state
    const decks = useMemo(() => {
        return isAuthenticated ? dbDecks : guestState.decks;
    }, [isAuthenticated, dbDecks, guestState.decks]);

    // Get current deck
    const currentDeck = useMemo(() => {
        if (!currentDeckId) return null;
        const deck = decks.find((d) => d.id === currentDeckId);
        if (!deck) return null;
        return {
            ...deck,
            cards: normalizeDeckCards(deck.cards),
        };
    }, [currentDeckId, decks]);

    const updateActiveDecks = useCallback((updater: (decks: Deck[]) => Deck[]) => {
        if (isAuthenticated) {
            setDbDecks(updater);
        } else {
            setGuestState((prev) => ({ ...prev, decks: updater(prev.decks) }));
        }
    }, [isAuthenticated]);

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

    /**
     * Set initial data from server components to sync state
     * @param decks Initial decks from server
     * @param userMaxDecks Maximum decks limit for the user
     */
    const setInitialData = useCallback((decks: Deck[], userMaxDecks: number) => {
        // Deep compare with existing dbDecks to avoid unnecessary re-renders
        // This is crucial because revalidatePath calls can trigger this via AppMain
        setDbDecks(prev => {
            if (JSON.stringify(prev) === JSON.stringify(decks)) return prev;
            return decks;
        });
        
        setMaxDecks(prev => {
            if (prev === userMaxDecks) return prev;
            return userMaxDecks;
        });
        
        hasInitializedAuthData.current = true;
    }, []);

    // Sign out handler
    const handleSignOut = useCallback(() => {
        signOut({ callbackUrl: "/" });
    }, []);

    // Add a new deck
    const addDeck = useCallback(async (name: string, content: string | { question: string; answer: string; image?: string }[]) => {
        let parsedCards: { question: string; answer: string; image?: string }[] = [];

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
                alert(error instanceof Error ? error.message : "Failed to create deck. Please try again.");
            }
        } else {
            // Save to localStorage
            const deck = createLocalDeck(name, parsedCards);
            setGuestState((prev) => {
                if (prev.decks.length >= maxDecks) {
                    alert(`Maximum ${maxDecks} decks reached.`);
                    return prev;
                }
                return {
                    ...prev,
                    decks: [...prev.decks, deck],
                };
            });
        }
    }, [isAuthenticated, refreshDecks, maxDecks]);

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

    const updateCardLevel = useCallback(async (cardId: string, level: CardLevel) => {
        const previousLevel = decks
            .flatMap((d) => d.cards)
            .find((c) => c.id === cardId)?.level;

        const applyLevel = (nextLevel: CardLevel) => {
            updateActiveDecks((decks) => decks.map((deck) => ({
                ...deck,
                cards: deck.cards.map((card) =>
                    card.id === cardId ? { ...card, level: nextLevel } : card
                ),
                updatedAt: deck.cards.some((c) => c.id === cardId) ? Date.now() : deck.updatedAt,
            })));
        };

        applyLevel(level);

        if (isAuthenticated) {
            try {
                await updateDbCardLevel(cardId, level);
            } catch (error) {
                console.error("Failed to update card level:", error);
                if (previousLevel) {
                    applyLevel(previousLevel);
                }
                alert("Failed to save card progress. Please try again.");
            }
        }
    }, [decks, isAuthenticated, updateActiveDecks]);

    // Update a single card's question and answer
    const updateCard = useCallback(async (cardId: string, question: string, answer: string, image?: string) => {
        const imageValue = image?.trim() || undefined;
        const previous = decks
            .flatMap((d) => d.cards)
            .find((c) => c.id === cardId);

        const applyContent = (nextQuestion: string, nextAnswer: string, nextImage?: string) => {
            updateActiveDecks((decks) => decks.map((deck) => ({
                ...deck,
                cards: deck.cards.map((card) =>
                    card.id === cardId ? { ...card, question: nextQuestion, answer: nextAnswer, image: nextImage } : card
                ),
                updatedAt: deck.cards.some((c) => c.id === cardId) ? Date.now() : deck.updatedAt,
            })));
        };

        applyContent(question, answer, imageValue);

        if (isAuthenticated) {
            try {
                await updateDbCard(cardId, question, answer, imageValue);
            } catch (error) {
                console.error("Failed to update card:", error);
                if (previous) {
                    applyContent(previous.question, previous.answer, previous.image);
                }
                alert("Failed to save card changes. Please try again.");
            }
        }
    }, [decks, isAuthenticated, updateActiveDecks]);

    const syncDeckCards = useCallback(async (deckId: string, cards: EditableCard[]) => {
        const buildFlashcards = (existingCards: Flashcard[]): Flashcard[] => {
            const existingById = new Map(existingCards.map((c) => [c.id, c]));
            return cards.map((card, index) => {
                const image = card.image?.trim() || undefined;
                if (card.id && !card.id.startsWith("temp-") && existingById.has(card.id)) {
                    const existing = existingById.get(card.id)!;
                    return {
                        ...existing,
                        question: card.question,
                        answer: card.answer,
                        image,
                        sortOrder: index,
                    };
                }
                return {
                    id: generateId(),
                    question: card.question,
                    answer: card.answer,
                    image,
                    level: "Nowe" as CardLevel,
                    sortOrder: index,
                };
            });
        };

        updateActiveDecks((decks) =>
            decks.map((deck) =>
                deck.id === deckId
                    ? { ...deck, cards: buildFlashcards(deck.cards), updatedAt: Date.now() }
                    : deck
            )
        );

        if (isAuthenticated) {
            try {
                await syncDbDeckCards(deckId, cards);
                await refreshDecks();
            } catch (error) {
                console.error("Failed to sync deck cards:", error);
                throw error;
            }
        }
    }, [isAuthenticated, refreshDecks, updateActiveDecks]);

    const value = useMemo<AppContextType>(() => ({
        isAuthenticated,
        isGuest,
        isAdmin,
        authUser,
        authLoading,
        decks,
        currentDeck,
        isLoading,
        maxDecks,
        setInitialData,
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
        syncDeckCards,
    }), [
        isAuthenticated,
        isGuest,
        isAdmin,
        authUser,
        authLoading,
        decks,
        currentDeck,
        isLoading,
        maxDecks,
        setInitialData,
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
        syncDeckCards,
    ]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useApp must be used within AppProvider");
    }
    return context;
}
