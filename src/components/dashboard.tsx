"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/app-context";
import { useDeckImport } from "@/hooks/use-deck-import";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Trash2, BookOpen, Pencil, Check, X, Download } from "lucide-react";
import { GlobalDecksModal } from "@/components/global-decks-modal";
import { Deck } from "@/lib/types";
import { DASHBOARD_LONG_PRESS_MS } from "@/lib/constants";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

export function Dashboard() {
    const {
        decks,
        selectDeck,
        deleteDeck,
        renameDeck,
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

    const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const [contextMenuDeck, setContextMenuDeck] = useState<Deck | null>(null);
    const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

    const startEditing = (deckId: string, currentName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingDeckId(deckId);
        setEditingName(currentName);
    };

    const saveRename = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (editingDeckId && editingName.trim()) {
            renameDeck(editingDeckId, editingName.trim());
        }
        setEditingDeckId(null);
        setEditingName("");
    };

    const cancelEditing = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setEditingDeckId(null);
        setEditingName("");
    };

    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            saveRename();
        } else if (e.key === "Escape") {
            cancelEditing();
        }
    };

    // Export deck to txt file
    const exportDeck = useCallback((deck: Deck) => {
        const content = deck.cards
            .map((card) => `${card.question} | ${card.answer}`)
            .join("\n");

        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${deck.name}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setContextMenuDeck(null);
    }, []);

    // Long press handlers for mobile
    const handleTouchStart = useCallback((deck: Deck) => {
        longPressTimerRef.current = setTimeout(() => {
            setContextMenuDeck(deck);
        }, DASHBOARD_LONG_PRESS_MS);
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    }, []);

    const closeContextMenu = useCallback(() => {
        setContextMenuDeck(null);
    }, []);

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

                {/* Drop Zone */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-border rounded-2xl p-8 text-center mb-8 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">{t("dashboard.dropZoneTitle")}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t("dashboard.dropZoneDescription")}
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </motion.div>

                {/* Import Form */}
                {isImporting && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="bg-card rounded-xl p-4 mb-8 border border-border"
                    >
                        <input
                            type="text"
                            value={deckName}
                            onChange={(e) => setDeckName(e.target.value)}
                            placeholder={t("dashboard.deckNamePlaceholder")}
                            className="w-full p-3 rounded-lg bg-background border border-input mb-3"
                        />
                        <div className="flex gap-2">
                            <Button onClick={() => fileInputRef.current?.click()}>
                                {t("dashboard.chooseFile")}
                            </Button>
                            <Button variant="ghost" onClick={() => setIsImporting(false)}>
                                {t("common.cancel")}
                            </Button>
                        </div>
                    </motion.div>
                )}

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
                                <div
                                    key={deck.id}
                                    className="deck-card-animate group bg-card rounded-xl p-4 border border-border hover:border-primary/30 transition-all cursor-pointer"
                                    onClick={() => editingDeckId !== deck.id && contextMenuDeck === null && selectDeck(deck.id)}
                                    onTouchStart={() => handleTouchStart(deck)}
                                    onTouchEnd={handleTouchEnd}
                                    onTouchCancel={handleTouchEnd}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <AnimatePresence mode="wait">
                                                {editingDeckId === deck.id ? (
                                                    <motion.div
                                                        key="editing"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="flex items-center gap-2"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <input
                                                            type="text"
                                                            value={editingName}
                                                            onChange={(e) => setEditingName(e.target.value)}
                                                            onKeyDown={handleRenameKeyDown}
                                                            autoFocus
                                                            className="flex-1 p-2 rounded-lg bg-background border border-input focus:border-primary focus:outline-none text-lg font-semibold"
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={saveRename}
                                                            className="text-emerald-500 hover:text-emerald-600"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={cancelEditing}
                                                            className="text-muted-foreground"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="display"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors truncate max-w-[200px] sm:max-w-none">
                                                                {deck.name}
                                                            </h3>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => startEditing(deck.id, deck.name, e)}
                                                                className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity h-6 w-6"
                                                            >
                                                                <Pencil className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {t("dashboard.cardsCount", { count: deck.cards.length })}
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        {editingDeckId !== deck.id && (
                                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        exportDeck(deck);
                                                    }}
                                                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                                                    title={t("common.export")}
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeckToDelete(deck);
                                                    }}
                                                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    {/* Progress bar */}
                                    <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all"
                                            style={{
                                                width: `${deck.cards.length > 0
                                                    ? (deck.cards.filter((c) => c.level !== "Nowe").length / deck.cards.length) * 100
                                                    : 0}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Context Menu */}
            <AnimatePresence>
                {contextMenuDeck && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
                        onClick={closeContextMenu}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute left-4 right-4 bottom-8 bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-border">
                                <h3 className="font-semibold truncate">{contextMenuDeck.name}</h3>
                                <p className="text-sm text-muted-foreground">{t("dashboard.cardsCount", { count: contextMenuDeck.cards.length })}</p>
                            </div>
                            <div className="p-2">
                                <button
                                    onClick={() => {
                                        setEditingDeckId(contextMenuDeck.id);
                                        setEditingName(contextMenuDeck.name);
                                        closeContextMenu();
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                                >
                                    <Pencil className="w-5 h-5 text-muted-foreground" />
                                    <span>{t("common.rename")}</span>
                                </button>
                                <button
                                    onClick={() => exportDeck(contextMenuDeck)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                                >
                                    <Download className="w-5 h-5 text-muted-foreground" />
                                    <span>{t("common.export")}</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setDeckToDelete(contextMenuDeck);
                                        closeContextMenu();
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left text-destructive"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    <span>{t("common.delete")}</span>
                                </button>
                            </div>
                            <button
                                onClick={closeContextMenu}
                                className="w-full p-4 text-center text-muted-foreground hover:bg-muted transition-colors border-t border-border"
                            >
                                {t("common.cancel")}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
