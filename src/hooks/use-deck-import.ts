"use client";

import { useState, useRef, useCallback } from "react";
import { useApp } from "@/lib/app-context";
import { useI18n } from "@/lib/i18n-context";
import { useDeckEditorSession } from "@/lib/deck-editor-session-context";
import { parseQuestionsFile } from "@/lib/storage";
import { isDesktopViewport } from "@/lib/utils";
import { parsedToEditableCards } from "@/lib/deck-editor";

/**
 * Hook for managing deck file importing (Drag and Drop & File Input)
 */
export function useDeckImport() {
    const { addDeck } = useApp();
    const { t } = useI18n();
    const { openImportEditor } = useDeckEditorSession();
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

            if (isDesktopViewport()) {
                openImportEditor(parsedToEditableCards(parsedCards), name);
            } else {
                addDeck(name, content);
            }
        },
        [addDeck, openImportEditor, t]
    );

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
