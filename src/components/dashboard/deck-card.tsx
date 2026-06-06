"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Check, X, Download, Trash2, ListTree } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useI18n } from "@/lib/i18n-context";
import { Button } from "@/components/ui/button";
import { Deck } from "@/lib/types";
import { DASHBOARD_LONG_PRESS_MS } from "@/lib/constants";

interface DeckCardProps {
    deck: Deck;
    onSelect: (id: string) => void;
    onDelete: (deck: Deck) => void;
    onEditSet?: (deck: Deck) => void;
}

/**
 * Individual deck card with inline editing and mobile context menu.
 */
export function DeckCard({ deck, onSelect, onDelete, onEditSet }: DeckCardProps) {
    const { renameDeck } = useApp();
    const { t } = useI18n();
    const [isEditing, setIsEditing] = useState(false);
    const [editingName, setEditingName] = useState(deck.name);
    const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * Handles starting the rename process
     */
    const startEditing = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditingName(deck.name);
    };

    /**
     * Saves the new name and exits editing mode
     */
    const saveRename = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (editingName.trim() && editingName.trim() !== deck.name) {
            renameDeck(deck.id, editingName.trim());
        }
        setIsEditing(false);
    };

    /**
     * Cancels renaming and exits editing mode
     */
    const cancelEditing = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIsEditing(false);
        setEditingName(deck.name);
    };

    /**
     * Handles keyboard shortcuts for renaming
     */
    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            saveRename();
        } else if (e.key === "Escape") {
            cancelEditing();
        }
    };

    /**
     * Exports deck to a .txt file
     */
    const handleExport = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
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
        setIsContextMenuOpen(false);
    }, [deck]);

    /**
     * Mobile long press: Start
     */
    const handleTouchStart = useCallback(() => {
        longPressTimerRef.current = setTimeout(() => {
            setIsContextMenuOpen(true);
        }, DASHBOARD_LONG_PRESS_MS);
    }, []);

    /**
     * Mobile long press: End
     */
    const handleTouchEnd = useCallback(() => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    }, []);

    /**
     * Keyboard navigation for the card
     */
    const handleCardKeyDown = (e: React.KeyboardEvent) => {
        if (isEditing) return;
        
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(deck.id);
        } else if (e.key === "F2") {
            startEditing(e);
        }
    };

    return (
        <>
            <div
                className="deck-card-animate group bg-card rounded-xl p-4 border border-border hover:border-primary/30 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={() => !isEditing && !isContextMenuOpen && onSelect(deck.id)}
                onKeyDown={handleCardKeyDown}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                tabIndex={0}
                role="button"
                aria-label={t("dashboard.cardsCount", { count: deck.cards.length })}
            >
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            {isEditing ? (
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
                                        aria-label={t("common.rename")}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={saveRename}
                                        className="text-emerald-500 hover:text-emerald-600"
                                        aria-label={t("common.save")}
                                    >
                                        <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={cancelEditing}
                                        className="text-muted-foreground"
                                        aria-label={t("common.cancel")}
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
                                            onClick={startEditing}
                                            className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity h-6 w-6"
                                            aria-label={t("common.rename")}
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
                    {!isEditing && (
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                            {onEditSet && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditSet(deck);
                                    }}
                                    className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                                    title={t("dashboard.editDeckSet")}
                                    aria-label={t("dashboard.editDeckSet")}
                                >
                                    <ListTree className="w-4 h-4" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleExport}
                                className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                                title={t("common.export")}
                                aria-label={t("common.export")}
                            >
                                <Download className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(deck);
                                }}
                                className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                aria-label={t("common.delete")}
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

            {/* Mobile Context Menu */}
            <AnimatePresence>
                {isContextMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
                        onClick={() => setIsContextMenuOpen(false)}
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
                                <h3 className="font-semibold truncate">{deck.name}</h3>
                                <p className="text-sm text-muted-foreground">{t("dashboard.cardsCount", { count: deck.cards.length })}</p>
                            </div>
                            <div className="p-2">
                                <button
                                    onClick={(e) => {
                                        startEditing(e);
                                        setIsContextMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                                >
                                    <Pencil className="w-5 h-5 text-muted-foreground" />
                                    <span>{t("common.rename")}</span>
                                </button>
                                <button
                                    onClick={handleExport}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                                >
                                    <Download className="w-5 h-5 text-muted-foreground" />
                                    <span>{t("common.export")}</span>
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete(deck);
                                        setIsContextMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left text-destructive"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    <span>{t("common.delete")}</span>
                                </button>
                            </div>
                            <button
                                onClick={() => setIsContextMenuOpen(false)}
                                className="w-full p-4 text-center text-muted-foreground hover:bg-muted transition-colors border-t border-border"
                            >
                                {t("common.cancel")}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
