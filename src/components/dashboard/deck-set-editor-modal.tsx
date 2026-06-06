"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus, Search, Loader2 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { EditableCard, Deck, Flashcard } from "@/lib/types";
import { FlashcardContent } from "@/components/flashcard/flashcard-content";
import { FlashcardZoomModal } from "@/components/flashcard/flashcard-zoom-modal";
import { generateId } from "@/lib/storage";

export type DeckSetEditorMode = "import" | "edit";

interface DeckSetEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: DeckSetEditorMode;
    initialCards: EditableCard[];
    deckName: string;
    deckId?: string;
}

type PreviewTarget = { cardId: string; field: "question" | "answer" } | null;

export function deckToEditableCards(deck: Deck): EditableCard[] {
    return deck.cards.map((card) => ({
        id: card.id,
        question: card.question,
        answer: card.answer,
        image: card.image,
        level: card.level,
    }));
}

export function parsedToEditableCards(
    cards: Omit<Flashcard, "id" | "level">[]
): EditableCard[] {
    const base = Date.now();
    return cards.map((card, index) => ({
        id: `temp-${base}-${index}`,
        question: card.question,
        answer: card.answer,
        image: card.image,
    }));
}

export function DeckSetEditorModal({
    isOpen,
    onClose,
    mode,
    initialCards,
    deckName,
    deckId,
}: DeckSetEditorModalProps) {
    const { addDeck, syncDeckCards, t } = useApp();
    const [cards, setCards] = useState<EditableCard[]>(initialCards);
    const [name, setName] = useState(deckName);
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [preview, setPreview] = useState<PreviewTarget>(null);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCards(initialCards);
            setName(deckName);
            setSearch("");
            setExpandedId(null);
            setPreview(null);
        }
    }, [isOpen, initialCards, deckName]);

    const filteredCards = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return cards;
        return cards.filter(
            (card) =>
                card.question.toLowerCase().includes(query) ||
                card.answer.toLowerCase().includes(query)
        );
    }, [cards, search]);

    const previewCard = preview
        ? cards.find((card) => card.id === preview.cardId)
        : null;

    const updateCard = useCallback((id: string, patch: Partial<EditableCard>) => {
        setCards((prev) =>
            prev.map((card) => (card.id === id ? { ...card, ...patch } : card))
        );
    }, []);

    const deleteCard = useCallback((id: string) => {
        setCards((prev) => prev.filter((card) => card.id !== id));
        if (expandedId === id) setExpandedId(null);
        if (preview?.cardId === id) setPreview(null);
    }, [expandedId, preview]);

    const addCard = useCallback(() => {
        const newCard: EditableCard = {
            id: `temp-${generateId()}`,
            question: "",
            answer: "",
        };
        setCards((prev) => [...prev, newCard]);
        setExpandedId(newCard.id);
    }, []);

    const handlePrimaryAction = async () => {
        const validCards = cards.filter((card) => card.question.trim());
        if (validCards.length === 0) return;

        setIsSaving(true);
        try {
            if (mode === "import") {
                await addDeck(
                    name.trim() || deckName,
                    validCards.map(({ question, answer, image }) => ({
                        question,
                        answer,
                        image: image?.trim() || undefined,
                    }))
                );
                onClose();
            } else if (deckId) {
                await syncDeckCards(
                    deckId,
                    validCards.map((card) => ({
                        ...card,
                        image: card.image?.trim() || undefined,
                    }))
                );
                onClose();
            }
        } catch (error) {
            console.error("Failed to save deck:", error);
            alert(error instanceof Error ? error.message : "Failed to save deck.");
        } finally {
            setIsSaving(false);
        }
    };

    const truncate = (text: string, max = 160) =>
        text.length > max ? `${text.slice(0, max)}…` : text;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
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
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder={t("deckEditor.searchPlaceholder")}
                                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-input focus:border-primary focus:outline-none text-sm"
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground shrink-0">
                                    {t("deckEditor.resultsCount", {
                                        total: cards.length,
                                        filtered: filteredCards.length,
                                    })}
                                </span>
                            </div>
                        </DialogHeader>

                        <div className="flex flex-1 min-h-0 overflow-hidden">
                            <div className="flex-[1.15] min-w-0 overflow-y-auto p-5 space-y-3 border-r border-border">
                                {filteredCards.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        {t("deckEditor.noResults")}
                                    </p>
                                ) : (
                                    filteredCards.map((card) => {
                                        const cardIndex = cards.findIndex((c) => c.id === card.id);
                                        const isExpanded = expandedId === card.id;

                                        return (
                                            <div
                                                key={card.id}
                                                className="rounded-lg border border-border bg-card/50 overflow-hidden"
                                            >
                                                <div className="flex items-start gap-3 p-4">
                                                    <span className="text-xs font-mono text-muted-foreground pt-0.5 shrink-0 w-16">
                                                        {t("deckEditor.cardNumber", {
                                                            number: cardIndex + 1,
                                                        })}
                                                    </span>
                                                    <div className="flex-1 min-w-0 space-y-2">
                                                        <div
                                                            className="text-sm leading-relaxed cursor-default rounded px-1.5 py-1 -mx-1.5 hover:bg-muted/60 transition-colors"
                                                            onMouseEnter={() =>
                                                                setPreview({
                                                                    cardId: card.id,
                                                                    field: "question",
                                                                })
                                                            }
                                                        >
                                                            <span className="font-semibold text-indigo-400">
                                                                {t("deckEditor.question")}:
                                                            </span>{" "}
                                                            <span className="text-foreground/90">
                                                                {truncate(card.question) || "—"}
                                                            </span>
                                                        </div>
                                                        <div
                                                            className="text-sm leading-relaxed cursor-default rounded px-1.5 py-1 -mx-1.5 hover:bg-muted/60 transition-colors"
                                                            onMouseEnter={() =>
                                                                setPreview({
                                                                    cardId: card.id,
                                                                    field: "answer",
                                                                })
                                                            }
                                                        >
                                                            <span className="font-semibold text-emerald-400">
                                                                {t("deckEditor.answer")}:
                                                            </span>{" "}
                                                            <span className="text-foreground/90">
                                                                {truncate(card.answer) || "—"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() =>
                                                                setExpandedId(
                                                                    isExpanded ? null : card.id
                                                                )
                                                            }
                                                            aria-label={t("common.rename")}
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                                            onClick={() => deleteCard(card.id)}
                                                            aria-label={t("deckEditor.deleteCard")}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {isExpanded && (
                                                    <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-4 ml-[4.75rem] mr-12">
                                                        <label className="block text-xs font-medium text-muted-foreground">
                                                            {t("deckEditor.question")}
                                                        </label>
                                                        <textarea
                                                            value={card.question}
                                                            onChange={(e) =>
                                                                updateCard(card.id, {
                                                                    question: e.target.value,
                                                                })
                                                            }
                                                            rows={3}
                                                            className="w-full p-3 text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none resize-y min-h-[4.5rem]"
                                                        />
                                                        <label className="block text-xs font-medium text-muted-foreground">
                                                            {t("deckEditor.answer")}
                                                        </label>
                                                        <textarea
                                                            value={card.answer}
                                                            onChange={(e) =>
                                                                updateCard(card.id, {
                                                                    answer: e.target.value,
                                                                })
                                                            }
                                                            rows={5}
                                                            className="w-full p-3 text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none resize-y min-h-[6rem]"
                                                        />
                                                        <label className="block text-xs font-medium text-muted-foreground">
                                                            {t("deckEditor.imageUrl")}
                                                        </label>
                                                        <input
                                                            type="url"
                                                            value={card.image ?? ""}
                                                            onChange={(e) =>
                                                                updateCard(card.id, {
                                                                    image: e.target.value,
                                                                })
                                                            }
                                                            placeholder={t(
                                                                "deckEditor.imageUrlPlaceholder"
                                                            )}
                                                            className="w-full p-3 text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={addCard}
                                    className="w-full gap-2 mt-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    {t("deckEditor.addCard")}
                                </Button>
                            </div>

                            <div className="w-[38%] min-w-[280px] max-w-[480px] shrink-0 p-5 overflow-y-auto bg-muted/20">
                                {!previewCard ? (
                                    <p className="text-sm text-muted-foreground text-center py-16 px-4">
                                        {t("deckEditor.hoverHint")}
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold text-muted-foreground">
                                            {preview?.field === "question"
                                                ? t("deckEditor.previewQuestion")
                                                : t("deckEditor.previewAnswer")}
                                        </h4>
                                        <div className="bg-card rounded-xl border border-border p-6 min-h-[200px] flex items-center justify-center">
                                            <FlashcardContent
                                                text={
                                                    preview?.field === "question"
                                                        ? previewCard.question
                                                        : previewCard.answer
                                                }
                                                isLarge={preview?.field === "question"}
                                                onImageZoom={setZoomedImage}
                                            />
                                        </div>
                                        {previewCard.image && (
                                            <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-center">
                                                <FlashcardContent
                                                    text={`[img:${previewCard.image}]`}
                                                    onImageZoom={setZoomedImage}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="px-6 py-4 border-t border-border shrink-0">
                            <Button variant="ghost" onClick={onClose} disabled={isSaving}>
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
