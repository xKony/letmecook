"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useApp } from "@/lib/app-context";
import { useI18n } from "@/lib/i18n-context";
import { useDeckImport } from "@/hooks/use-deck-import";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ImportDropZone } from "@/components/dashboard/import-drop-zone";
import { DeckCard } from "@/components/dashboard/deck-card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";
import { GlobalDecksModal } from "@/components/global-decks-modal";
import { Deck, EditableCard } from "@/lib/types";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { deckToEditableCards } from "@/lib/deck-editor";

const DeckSetEditorModal = dynamic(
    () => import("@/components/dashboard/deck-set-editor-modal").then((m) => m.DeckSetEditorModal),
    { ssr: false }
);

export function Dashboard() {
    const {
        decks,
        selectDeck,
        deleteDeck,
        isGuest,
        maxDecks,
    } = useApp();
    const { t } = useI18n();

    const [importPreview, setImportPreview] = useState<{
        cards: EditableCard[];
        name: string;
    } | null>(null);
    const [editDeckId, setEditDeckId] = useState<string | null>(null);

    const {
        isImporting,
        setIsImporting,
        deckName,
        setDeckName,
        fileInputRef,
        handleFileSelect,
        handleDrop,
        handleDragOver,
    } = useDeckImport((cards, name) => setImportPreview({ cards, name }));

    const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
    const editDeck = editDeckId
        ? decks.find((deck) => deck.id === editDeckId) ?? null
        : null;

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

            <DeckSetEditorModal
                isOpen={!!importPreview}
                mode="import"
                initialCards={importPreview?.cards ?? []}
                deckName={importPreview?.name ?? ""}
                onClose={() => setImportPreview(null)}
            />

            {editDeck && (
                <DeckSetEditorModal
                    isOpen={!!editDeck}
                    mode="edit"
                    deckId={editDeck.id}
                    initialCards={deckToEditableCards(editDeck)}
                    deckName={editDeck.name}
                    onClose={() => setEditDeckId(null)}
                />
            )}

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
                                    onEditSet={(d) => setEditDeckId(d.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
