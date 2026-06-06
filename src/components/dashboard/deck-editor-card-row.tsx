"use client";

import { memo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n-context";
import { EditableCard } from "@/lib/types";

function truncate(text: string, max = 160) {
    return text.length > max ? `${text.slice(0, max)}…` : text;
}

interface DeckEditorCardRowProps {
    card: EditableCard;
    cardIndex: number;
    isExpanded: boolean;
    onToggleExpand: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, patch: Partial<EditableCard>) => void;
    onPreviewHover: (cardId: string, field: "question" | "answer") => void;
}

export const DeckEditorCardRow = memo(function DeckEditorCardRow({
    card,
    cardIndex,
    isExpanded,
    onToggleExpand,
    onDelete,
    onUpdate,
    onPreviewHover,
}: DeckEditorCardRowProps) {
    const { t } = useI18n();

    return (
        <div className="rounded-lg border border-border bg-card/50 overflow-hidden [content-visibility:auto] [contain-intrinsic-size:auto_130px]">
            <div className="flex items-start gap-3 p-4">
                <span className="text-xs font-mono text-muted-foreground pt-0.5 shrink-0 w-16">
                    {t("deckEditor.cardNumber", { number: cardIndex + 1 })}
                </span>
                <div className="flex-1 min-w-0 space-y-2">
                    <div
                        className="text-sm leading-relaxed cursor-default rounded px-1.5 py-1 -mx-1.5 hover:bg-muted/60 transition-colors"
                        onMouseEnter={() => onPreviewHover(card.id, "question")}
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
                        onMouseEnter={() => onPreviewHover(card.id, "answer")}
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
                        onClick={() => onToggleExpand(card.id)}
                        aria-label={t("common.rename")}
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(card.id)}
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
                        onChange={(e) => onUpdate(card.id, { question: e.target.value })}
                        rows={3}
                        className="w-full p-3 text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none resize-y min-h-[4.5rem]"
                    />
                    <label className="block text-xs font-medium text-muted-foreground">
                        {t("deckEditor.answer")}
                    </label>
                    <textarea
                        value={card.answer}
                        onChange={(e) => onUpdate(card.id, { answer: e.target.value })}
                        rows={5}
                        className="w-full p-3 text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none resize-y min-h-[6rem]"
                    />
                    <label className="block text-xs font-medium text-muted-foreground">
                        {t("deckEditor.imageUrl")}
                    </label>
                    <input
                        type="url"
                        value={card.image ?? ""}
                        onChange={(e) => onUpdate(card.id, { image: e.target.value })}
                        placeholder={t("deckEditor.imageUrlPlaceholder")}
                        className="w-full p-3 text-sm rounded-lg bg-background border border-input focus:border-primary focus:outline-none"
                    />
                </div>
            )}
        </div>
    );
});
