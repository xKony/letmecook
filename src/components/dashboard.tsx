"use client";

import { useState } from "react";
import { useApp } from "@/lib/app-context";
import { useDeckImport } from "@/hooks/use-deck-import";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ImportDropZone } from "@/components/dashboard/import-drop-zone";
import { DeckCard } from "@/components/dashboard/deck-card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";
import { GlobalDecksModal } from "@/components/global-decks-modal";
import { Deck } from "@/lib/types";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

export function Dashboard() {
    const {
        decks,
        selectDeck,
        deleteDeck,
        isGuest,
        maxDecks,
        t,
    } = useApp();

    const {
        isImporting,
        setIsImporting,
        deckName,
        setDeckName,
        fileInputRef,
        handleFileSelect,
        handleDrop,
        handleDragOver,
    } = useDeckImport();

    const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);

    return (
        <div className="min-h-screen p-4 md:p-8">
            <ConfirmationModal
                isOpen={!!deckToDelete}
                title={t("dashboard.deleteDeckTitle")}
                description={t("dashboard.deleteDeckDescription", { name: deckToDelete?.name || "" })}
                confirmLabel={t("common.delete")}
                variant="destructive"
                onConfirm={() => {
                    if (deckToDelete) {
                        deleteDeck(deckToDelete.id);
                        setDeckToDelete(null);
                    }
                }}
                onCancel={() => setDeckToDelete(null)}
            />
            <div className="max-w-4xl mx-auto">
                <DashboardHeader />

                <ImportDropZone
                    isImporting={isImporting}
                    setIsImporting={setIsImporting}
                    deckName={deckName}
                    setDeckName={setDeckName}
                    fileInputRef={fileInputRef}
                    handleFileSelect={handleFileSelect}
                    handleDrop={handleDrop}
                    handleDragOver={handleDragOver}
                />

                {/* Deck List */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">
                            {isGuest ? t("dashboard.yourDecksGuest") : t("dashboard.yourDecks")} ({decks.length}/{maxDecks})
                        </h2>
                        <div className="flex gap-2">
                            <GlobalDecksModal />
                            <Button onClick={() => setIsImporting(true)} className="gap-2">
                                <Plus className="w-4 h-4" />
                                {t("dashboard.newDeck")}
                            </Button>
                        </div>
                    </div>

                    {decks.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>{t("dashboard.noDecks")}</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {decks.map((deck) => (
                                <DeckCard
                                    key={deck.id}
                                    deck={deck}
                                    onSelect={selectDeck}
                                    onDelete={setDeckToDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
