"use client";

import React from "react";
import { BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardLevel } from "@/lib/types";
import { LEVEL_COLORS, ALL_LEVELS } from "@/lib/level-styles";

interface StudySessionStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    stats: Record<CardLevel, number>;
    maxCount: number;
    activeFilter: CardLevel | null;
    totalCards: number;
    onFilterSelect: (level: CardLevel | null) => void;
    t: (key: string, options?: Record<string, string | number>) => string;
}

/**
 * Modal displaying deck statistics and allowing the user to filter cards by level.
 * 
 * @param isOpen Whether the modal is open.
 * @param onClose Callback to close the modal.
 * @param stats Object mapping card levels to their counts in the deck.
 * @param maxCount The maximum count among all levels.
 * @param activeFilter The currently active card level filter.
 * @param totalCards Total number of cards in the deck.
 * @param onFilterSelect Callback triggered when a filter level is selected.
 * @param t Translation function.
 */
export function StudySessionStatsModal({
    isOpen,
    onClose,
    stats,
    maxCount,
    activeFilter,
    totalCards,
    onFilterSelect,
    t,
}: StudySessionStatsModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" aria-hidden="true" />
                        {t("study.deckStats")}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 mt-4">
                    {ALL_LEVELS.map((level) => {
                        const count = stats[level] || 0;
                        const percentage = (count / maxCount) * 100;
                        const isActive = activeFilter === level;

                        return (
                            <button
                                key={level}
                                onClick={() => onFilterSelect(level)}
                                className={`w-full text-left p-3 rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary ${isActive
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

                <div className="border-t border-border pt-4 mt-2">
                    <p className="text-xs text-muted-foreground mb-3">
                        {t("study.clickToFilter")}
                    </p>
                    <Button
                        variant={activeFilter === null ? "default" : "outline"}
                        className="w-full"
                        onClick={() => onFilterSelect(null)}
                    >
                        {t("study.showAll", { count: totalCards })}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
