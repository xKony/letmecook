"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CardLevel } from "@/lib/types";

interface StudySessionEmptyStateProps {
    activeFilter: CardLevel | null;
    totalCardsInDeck: number;
    onResetFilter: () => void;
    t: (key: string, options?: Record<string, string | number>) => string;
}

/**
 * View displayed when no cards match the active level filter.
 */
export function StudySessionEmptyState({
    activeFilter,
    totalCardsInDeck,
    onResetFilter,
    t,
}: StudySessionEmptyStateProps) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
            <p className="text-muted-foreground text-center">
                {t("study.noCardsMatch", { filter: activeFilter ? t(`levels.${activeFilter}`) : "" })}
            </p>
            <Button onClick={onResetFilter}>
                {t("study.showAll", { count: totalCardsInDeck })}
            </Button>
        </div>
    );
}
