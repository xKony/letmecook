"use client";

import { useState, useRef, useCallback } from "react";
import { useApp } from "@/lib/app-context";

/**
 * Hook for managing deck file importing (Drag and Drop & File Input)
 */
export function useDeckImport() {
    const { addDeck } = useApp();
    const [isImporting, setIsImporting] = useState(false);
    const [deckName, setDeckName] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    /**
     * Handles file selection from the hidden input
     */
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const name = deckName.trim() || file.name.replace(/\.txt$/, "");
            addDeck(name, content);
            setIsImporting(false);
            setDeckName("");
            
            // Reset input value so the same file can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        };
        reader.readAsText(file);
    }, [addDeck, deckName]);

    /**
     * Handles file drop onto the drop zone
     */
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file || !file.name.endsWith(".txt")) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const name = file.name.replace(/\.txt$/, "");
            addDeck(name, content);
        };
        reader.readAsText(file);
    }, [addDeck]);

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
