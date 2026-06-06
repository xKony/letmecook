"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CardLevel } from "@/lib/types";

interface StudySessionEmptyStateProps {
    activeFilter: CardLevel | null;
    hasSearch: boolean;
    totalCardsInDeck: number;
    onResetFilter: () => void;
    onBackToDashboard: () => void;
    t: (key: string, options?: Record<string, string | number>) => string;
}

/**
 * View displayed when no cards match the current study session filter.
 * 
 * @param activeFilter The currently active card level filter.
 * @param totalCardsInDeck The total number of cards in the deck, regardless of filter.
 * @param onResetFilter Callback to clear the active filter.
 * @param onBackToDashboard Callback to close the deck and return to the dashboard.
 * @param t Translation function.
 */
export function StudySessionEmptyState({
    activeFilter,
    hasSearch,
    totalCardsInDeck,
    onResetFilter,
    onBackToDashboard,
    t,
}: StudySessionEmptyStateProps) {
    const message = hasSearch
        ? t("study.noSearchResults")
        : t("study.noCardsMatch", { filter: activeFilter ? t(`levels.${activeFilter}`) : "" });

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
            <p className="text-muted-foreground text-center">
                {message}
            </p>
            <Button onClick={onResetFilter}>
                {t("study.showAll", { count: totalCardsInDeck })}
            </Button>
            <Button variant="ghost" onClick={onBackToDashboard}>
                {t("common.backToDashboard")}
            </Button>
        </div>
    );
}
