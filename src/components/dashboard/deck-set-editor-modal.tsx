"use client";

import { useMemo, useCallback, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useI18n } from "@/lib/i18n-context";
import { useDeckEditorSession } from "@/lib/deck-editor-session-context";
import { EditableCard } from "@/lib/types";
import { FlashcardZoomModal } from "@/components/flashcard/flashcard-zoom-modal";
import { generateId } from "@/lib/storage";
import { DeckEditorCardRow } from "@/components/dashboard/deck-editor-card-row";
import { DeckEditorPreviewPanel } from "@/components/dashboard/deck-editor-preview-panel";

type PreviewTarget = { cardId: string; field: "question" | "answer" } | null;

export function DeckSetEditorModal() {
    const { addDeck, syncDeckCards } = useApp();
    const { t } = useI18n();
    const { session, closeEditor, patchSession, updateSessionCards } = useDeckEditorSession();
    const [preview, setPreview] = useState<PreviewTarget>(null);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const isOpen = session !== null;
    const mode = session?.mode ?? "edit";
    const deckId = session?.deckId;
    const deckName = session?.deckName ?? "";
    const cards = session?.cards ?? [];
    const search = session?.search ?? "";
    const expandedId = session?.expandedId ?? null;
    const importDeckName = session?.deckName ?? "";

    const cardIndexById = useMemo(() => {
        const map = new Map<string, number>();
        cards.forEach((card, index) => map.set(card.id, index));
        return map;
    }, [cards]);

    const filteredCardsWithIndex = useMemo(() => {
        const query = search.trim().toLowerCase();
        const filtered = query
            ? cards.filter(
                  (card) =>
                      card.question.toLowerCase().includes(query) ||
                      card.answer.toLowerCase().includes(query)
              )
            : cards;

        return filtered.map((card) => ({
            card,
            index: cardIndexById.get(card.id) ?? 0,
        }));
    }, [cards, search, cardIndexById]);

    const previewCard = useMemo(() => {
        if (!preview) return null;
        return cards.find((card) => card.id === preview.cardId) ?? null;
    }, [preview, cards]);

    const updateCard = useCallback(
        (id: string, patch: Partial<EditableCard>) => {
            updateSessionCards((prev) =>
                prev.map((card) => (card.id === id ? { ...card, ...patch } : card))
            );
        },
        [updateSessionCards]
    );

    const deleteCard = useCallback(
        (id: string) => {
            updateSessionCards((prev) => prev.filter((card) => card.id !== id));
            if (expandedId === id) {
                patchSession({ expandedId: null });
            }
            if (preview?.cardId === id) {
                setPreview(null);
            }
        },
        [updateSessionCards, expandedId, preview, patchSession]
    );

    const addCard = useCallback(() => {
        const newCard: EditableCard = {
            id: `temp-${generateId()}`,
            question: "",
            answer: "",
        };
        updateSessionCards((prev) => [...prev, newCard]);
        patchSession({ expandedId: newCard.id });
    }, [updateSessionCards, patchSession]);

    const handleToggleExpand = useCallback(
        (id: string) => {
            patchSession({ expandedId: expandedId === id ? null : id });
        },
        [expandedId, patchSession]
    );

    const handlePreviewHover = useCallback((cardId: string, field: "question" | "answer") => {
        setPreview((current) => {
            if (current?.cardId === cardId && current?.field === field) return current;
            return { cardId, field };
        });
    }, []);

    const handleImageZoom = useCallback((url: string) => {
        setZoomedImage(url);
    }, []);

    const handlePrimaryAction = async () => {
        const validCards = cards.filter((card) => card.question.trim());
        if (validCards.length === 0) return;

        const blankCount = cards.length - validCards.length;
        if (blankCount > 0) {
            const confirmed = window.confirm(
                t("deckEditor.dropBlankCardsConfirm", { count: blankCount })
            );
            if (!confirmed) return;
        }

        setIsSaving(true);
        try {
            if (mode === "import") {
                await addDeck(
                    importDeckName.trim() || deckName,
                    validCards.map(({ question, answer, image }) => ({
                        question,
                        answer,
                        image: image?.trim() || undefined,
                    }))
                );
                closeEditor();
            } else if (deckId) {
                await syncDeckCards(
                    deckId,
                    validCards.map((card) => ({
                        ...card,
                        image: card.image?.trim() || undefined,
                    }))
                );
                closeEditor();
            }
        } catch (error) {
            console.error("Failed to save deck:", error);
            alert(error instanceof Error ? error.message : "Failed to save deck.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && closeEditor()}>
                <DialogContent
                    className="hidden md:grid w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] lg:max-w-7xl xl:max-w-[90rem] h-[min(92vh,960px)] max-h-[92vh] overflow-hidden p-0 gap-0"
                    showCloseButton
                >
                    <div className="flex flex-col h-full min-h-0">
                        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0 text-left">
                            <DialogTitle>
                                {mode === "import"
                                    ? t("deckEditor.titleImport")
                                    : t("deckEditor.titleEdit")}
                            </DialogTitle>
                            {mode === "import" && (
                                <input
                                    type="text"
                                    value={importDeckName}
                                    onChange={(e) => patchSession({ deckName: e.target.value })}
                                    placeholder={t("deckEditor.deckName")}
                                    className="mt-2 w-full p-2 rounded-lg bg-background border border-input focus:border-primary focus:outline-none text-sm"
                                />
                            )}
                            {mode === "edit" && (
                                <p className="text-sm text-muted-foreground mt-1">{deckName}</p>
                            )}
                            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                                <div className="relative flex-1 min-w-0">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(e) => patchSession({ search: e.target.value })}
                                        placeholder={t("deckEditor.searchPlaceholder")}
                                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-input focus:border-primary focus:outline-none text-sm"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground shrink-0">
                                    {t("deckEditor.resultsCount", {
                                        total: cards.length,
                                        filtered: filteredCardsWithIndex.length,
                                    })}
                                </span>
                            </div>
                        </DialogHeader>

                        <div className="flex flex-1 min-h-0 overflow-hidden">
                            <div className="flex-[1.15] min-w-0 flex flex-col min-h-0 border-r border-border">
                                <div className="flex-1 min-h-0 overflow-y-auto p-5">
                                    {filteredCardsWithIndex.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            {t("deckEditor.noResults")}
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {filteredCardsWithIndex.map(({ card, index }) => (
                                                <DeckEditorCardRow
                                                    key={card.id}
                                                    card={card}
                                                    cardIndex={index}
                                                    isExpanded={expandedId === card.id}
                                                    onToggleExpand={handleToggleExpand}
                                                    onDelete={deleteCard}
                                                    onUpdate={updateCard}
                                                    onPreviewHover={handlePreviewHover}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="shrink-0 px-5 pb-5 pt-2 border-t border-border/50 bg-background">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={addCard}
                                        className="w-full gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {t("deckEditor.addCard")}
                                    </Button>
                                </div>
                            </div>

                            <div className="w-[38%] min-w-[280px] max-w-[480px] shrink-0 p-5 overflow-y-auto bg-muted/20">
                                <DeckEditorPreviewPanel
                                    previewField={preview?.field ?? null}
                                    card={previewCard}
                                    onImageZoom={handleImageZoom}
                                />
                            </div>
                        </div>

                        <DialogFooter className="px-6 py-4 border-t border-border shrink-0">
                            <Button variant="ghost" onClick={closeEditor} disabled={isSaving}>
                                {t("common.cancel")}
                            </Button>
                            <Button
                                onClick={handlePrimaryAction}
                                disabled={
                                    isSaving ||
                                    cards.filter((c) => c.question.trim()).length === 0
                                }
                            >
                                {isSaving && (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                )}
                                {mode === "import"
                                    ? t("deckEditor.acceptImport")
                                    : t("deckEditor.saveChanges")}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <FlashcardZoomModal
                zoomedImage={zoomedImage}
                onClose={() => setZoomedImage(null)}
            />
        </>
    );
}
