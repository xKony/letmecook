"use client";

import React, { useMemo } from "react";
import { BarChart3, Search } from "lucide-react";
import { motion } from "framer-motion";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardLevel, Flashcard } from "@/lib/types";
import { LEVEL_COLORS, ALL_LEVELS } from "@/lib/level-styles";

interface StudySessionStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    stats: Record<CardLevel, number>;
    maxCount: number;
    activeFilter: CardLevel | null;
    searchQuery: string;
    totalCards: number;
    filteredCardCount: number;
    searchResults: Flashcard[];
    playOrder: string[];
    onSearchChange: (query: string) => void;
    onFilterSelect: (level: CardLevel | null) => void;
    onCardSelect: (cardId: string) => void;
    onClearFilters: () => void;
    t: (key: string, options?: Record<string, string | number>) => string;
}

/**
 * Modal displaying deck statistics, search, and allowing the user to filter cards by level.
 */
export function StudySessionStatsModal({
    isOpen,
    onClose,
    stats,
    maxCount,
    activeFilter,
    searchQuery,
    totalCards,
    filteredCardCount,
    searchResults,
    playOrder,
    onSearchChange,
    onFilterSelect,
    onCardSelect,
    onClearFilters,
    t,
}: StudySessionStatsModalProps) {
    const trimmedSearch = searchQuery.trim();
    const hasSearch = trimmedSearch.length > 0;
    const hasActiveFilters = activeFilter !== null || hasSearch;

    const playIndexById = useMemo(() => {
        const map = new Map<string, number>();
        playOrder.forEach((cardId, index) => map.set(cardId, index));
        return map;
    }, [playOrder]);

    const searchScopeCount = activeFilter ? filteredCardCount : totalCards;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" aria-hidden="true" />
                        {t("study.deckStats")}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-2 mt-2 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={t("study.searchPlaceholder")}
                            className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-input focus:border-primary focus:outline-none text-sm"
                            aria-label={t("study.searchPlaceholder")}
                        />
                    </div>
                    {hasSearch && (
                        <p className="text-xs text-muted-foreground">
                            {t("study.resultsCount", {
                                total: searchScopeCount,
                                filtered: searchResults.length,
                            })}
                        </p>
                    )}
                </div>

                {hasSearch && (
                    <div className="shrink-0 max-h-36 overflow-y-auto -mx-1 px-1 space-y-1">
                        {searchResults.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-3">
                                {t("study.noSearchResultsFor", { query: trimmedSearch })}
                            </p>
                        ) : (
                            searchResults.map((card) => {
                                const index = playIndexById.get(card.id);
                                if (index === undefined) return null;
                                return (
                                    <button
                                        key={card.id}
                                        type="button"
                                        onClick={() => onCardSelect(card.id)}
                                        className="w-full text-left p-2.5 rounded-lg hover:bg-muted/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    >
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs text-muted-foreground tabular-nums">
                                                #{index + 1}
                                            </span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${LEVEL_COLORS[card.level].bg} ${LEVEL_COLORS[card.level].text}`}>
                                                {t(`levels.${card.level}`)}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium line-clamp-1">{card.question}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{card.answer}</p>
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}

                <div className="space-y-3 mt-2 overflow-y-auto min-h-0">
                    {ALL_LEVELS.map((level) => {
                        const count = stats[level] || 0;
                        const percentage = (count / maxCount) * 100;
                        const isActive = activeFilter === level;

                        return (
                            <button
                                key={level}
                                onClick={() => onFilterSelect(level)}
                                className={`w-full text-left p-3 rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary ${isActive
                                    ? `${LEVEL_COLORS[level].bg} ring-2 ring-offset-2 ring-offset-background ${LEVEL_COLORS[level].text.replace('text-', 'ring-')}`
                                    : 'hover:bg-muted/50'
                                    }`}
                                aria-label={`${t(`levels.${level}`)}: ${count} cards`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`text-sm font-medium ${LEVEL_COLORS[level].text}`}>
                                        {t(`levels.${level}`)}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {t("dashboard.cardsCount", { count })}
                                    </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 0.5, delay: 0.1 }}
                                        className={`h-full rounded-full ${LEVEL_COLORS[level].bar}`}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="border-t border-border pt-4 mt-2 shrink-0">
                    <p className="text-xs text-muted-foreground mb-3">
                        {t("study.clickToFilter")}
                    </p>
                    <Button
                        variant={hasActiveFilters ? "outline" : "default"}
                        className="w-full"
                        onClick={onClearFilters}
                    >
                        {t("study.showAll", { count: totalCards })}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
