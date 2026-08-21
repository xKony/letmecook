"use client";

import { memo } from "react";
import { FlashcardContent } from "@/components/flashcard/flashcard-content";
import { useI18n } from "@/lib/i18n-context";
import { EditableCard } from "@/lib/types";

type PreviewField = "question" | "answer";

interface DeckEditorPreviewPanelProps {
    previewField: PreviewField | null;
    card: EditableCard | null;
    onImageZoom: (url: string) => void;
}

export const DeckEditorPreviewPanel = memo(function DeckEditorPreviewPanel({
    previewField,
    card,
    onImageZoom,
}: DeckEditorPreviewPanelProps) {
    const { t } = useI18n();

    if (!card || !previewField) {
        return (
            <p className="text-sm text-muted-foreground text-center py-16 px-4">
                {t("deckEditor.hoverHint")}
            </p>
        );
    }

    const previewText = previewField === "question" ? card.question : card.answer;

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground">
                {previewField === "question"
                    ? t("deckEditor.previewQuestion")
                    : t("deckEditor.previewAnswer")}
            </h4>
            <div className="bg-card rounded-xl border border-border p-6 min-h-[200px] flex items-center justify-center">
                <FlashcardContent
                    text={previewText}
                    isLarge={previewField === "question"}
                    onImageZoom={onImageZoom}
                />
            </div>
            {card.image && (
                <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-center">
                    <FlashcardContent
                        text={`[img:${card.image}]`}
                        onImageZoom={onImageZoom}
                    />
                </div>
            )}
        </div>
    );
});
