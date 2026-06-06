"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Deck, EditableCard } from "@/lib/types";
import { deckToEditableCards } from "@/lib/deck-editor";
import { useApp } from "@/lib/app-context";

export type DeckEditorSessionMode = "import" | "edit";

export interface DeckEditorSession {
    mode: DeckEditorSessionMode;
    deckId?: string;
    deckName: string;
    cards: EditableCard[];
    search: string;
    expandedId: string | null;
}

interface DeckEditorSessionContextType {
    session: DeckEditorSession | null;
    openEditDeck: (deck: Deck) => void;
    openImportEditor: (cards: EditableCard[], name: string) => void;
    closeEditor: () => void;
    patchSession: (patch: Partial<DeckEditorSession>) => void;
    updateSessionCards: (
        updater: EditableCard[] | ((prev: EditableCard[]) => EditableCard[])
    ) => void;
}

const DeckEditorSessionContext = createContext<DeckEditorSessionContextType | null>(null);

export function DeckEditorSessionProvider({ children }: { children: React.ReactNode }) {
    const { decks } = useApp();
    const [session, setSession] = useState<DeckEditorSession | null>(null);

    const openEditDeck = useCallback((deck: Deck) => {
        setSession((current) => {
            if (current?.mode === "edit" && current.deckId === deck.id) {
                return current;
            }
            return {
                mode: "edit",
                deckId: deck.id,
                deckName: deck.name,
                cards: deckToEditableCards(deck),
                search: "",
                expandedId: null,
            };
        });
    }, []);

    const openImportEditor = useCallback((cards: EditableCard[], name: string) => {
        setSession({
            mode: "import",
            deckName: name,
            cards,
            search: "",
            expandedId: null,
        });
    }, []);

    const closeEditor = useCallback(() => {
        setSession(null);
    }, []);

    const patchSession = useCallback((patch: Partial<DeckEditorSession>) => {
        setSession((current) => (current ? { ...current, ...patch } : current));
    }, []);

    const updateSessionCards = useCallback(
        (updater: EditableCard[] | ((prev: EditableCard[]) => EditableCard[])) => {
            setSession((current) => {
                if (!current) return current;
                const nextCards =
                    typeof updater === "function" ? updater(current.cards) : updater;
                return { ...current, cards: nextCards };
            });
        },
        []
    );

    useEffect(() => {
        if (session?.mode === "edit" && session.deckId) {
            const deckStillExists = decks.some((deck) => deck.id === session.deckId);
            if (!deckStillExists) {
                setSession(null);
            }
        }
    }, [decks, session?.deckId, session?.mode]);

    const value = useMemo(
        () => ({
            session,
            openEditDeck,
            openImportEditor,
            closeEditor,
            patchSession,
            updateSessionCards,
        }),
        [session, openEditDeck, openImportEditor, closeEditor, patchSession, updateSessionCards]
    );

    return (
        <DeckEditorSessionContext.Provider value={value}>
            {children}
        </DeckEditorSessionContext.Provider>
    );
}

export function useDeckEditorSession() {
    const context = useContext(DeckEditorSessionContext);
    if (!context) {
        throw new Error("useDeckEditorSession must be used within DeckEditorSessionProvider");
    }
    return context;
}
