"use client";

import { useState, useRef, useCallback } from "react";
import { useApp } from "@/lib/app-context";
import { parseQuestionsFile } from "@/lib/storage";
import { isDesktopViewport } from "@/lib/utils";
import { EditableCard } from "@/lib/types";
import { parsedToEditableCards } from "@/components/dashboard/deck-set-editor-modal";

/**
 * Hook for managing deck file importing (Drag and Drop & File Input)
 */
export function useDeckImport(
    onDesktopImportPreview?: (cards: EditableCard[], name: string) => void
) {
    const { addDeck, t } = useApp();
    const [isImporting, setIsImporting] = useState(false);
    const [deckName, setDeckName] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFileContent = useCallback(
        (content: string, fileName: string, optionalName?: string) => {
            const parsedCards = parseQuestionsFile(content);
            if (parsedCards.length === 0) {
                alert(t("deckEditor.parseError"));
                return;
            }

            const name =
                optionalName?.trim() || fileName.replace(/\.(txt|json)$/, "");

            if (isDesktopViewport() && onDesktopImportPreview) {
                onDesktopImportPreview(parsedToEditableCards(parsedCards), name);
            } else {
                addDeck(name, content);
            }
        },
        [addDeck, onDesktopImportPreview, t]
    );

    /**
     * Handles file selection from the hidden input
     */
    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                processFileContent(content, file.name, deckName);
                setIsImporting(false);
                setDeckName("");

                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            };
            reader.readAsText(file);
        },
        [deckName, processFileContent]
    );

    /**
     * Handles file drop onto the drop zone
     */
    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (
                !file ||
                !(file.name.endsWith(".txt") || file.name.endsWith(".json"))
            )
                return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                processFileContent(content, file.name);
            };
            reader.readAsText(file);
        },
        [processFileContent]
    );

    /**
     * Prevents default browser behavior for drag over
     */
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    return {
        isImporting,
        setIsImporting,
        deckName,
        setDeckName,
        fileInputRef,
        handleFileSelect,
        handleDrop,
        handleDragOver,
    };
}
