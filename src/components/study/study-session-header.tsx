"use client";

import React from "react";
import { X, Clock, Hash, Shuffle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardLevel } from "@/lib/types";
import { LEVEL_COLORS } from "@/lib/level-styles";

interface StudySessionHeaderProps {
    currentIndex: number;
    totalCards: number;
    timeSlot: React.ReactNode;
    isShuffled: boolean;
    activeFilter: CardLevel | null;
    onClose: () => void;
    onShowStats: () => void;
    onShowGoto: () => void;
    onShuffle: () => void;
    onReset: () => void;
    t: (key: string, options?: Record<string, string | number>) => string;
}

/**
 * Top bar header for the study session with controls and information.
 * 
 * @param currentIndex The current card index.
 * @param totalCards The total number of cards in play order.
 * @param timeSlot Live session duration node (self-subscribing timer leaf).
 * @param isShuffled Whether the play order is currently shuffled.
 * @param activeFilter The active card level filter.
 * @param onClose Callback to close the session.
 * @param onShowStats Callback to show the stats modal.
 * @param onShowGoto Callback to show the "Go to question" modal.
 * @param onShuffle Callback to toggle shuffle state.
 * @param onReset Callback to trigger progress reset.
 * @param t Translation function.
 */
export function StudySessionHeader({
    currentIndex,
    totalCards,
    timeSlot,
    isShuffled,
    activeFilter,
    onClose,
    onShowStats,
    onShowGoto,
    onShuffle,
    onReset,
    t,
}: StudySessionHeaderProps) {
    return (
        <header className="relative flex justify-between items-center mb-3 md:mb-4 max-w-2xl mx-auto w-full h-11 md:h-10 shrink-0">
            {/* Left: Close + Timer */}
            <div className="flex items-center gap-2 z-10">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onClose} 
                    className="h-11 w-11 md:h-10 md:w-10"
                    aria-label={t("common.close")}
                >
                    <X className="w-5 h-5" />
                </Button>
                <div 
                    className="flex items-center gap-1.5 text-sm tabular-nums text-muted-foreground" 
                    title={t("common.loading")}
                >
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    {timeSlot}
                </div>
            </div>

            {/* Center: Card counter */}
            <button
                onClick={onShowStats}
                className="absolute left-1/2 -translate-x-1/2 max-w-[45%] flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title={t("study.deckStats")}
                aria-label={t("study.deckStats")}
            >
                {activeFilter && (
                    <span className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${LEVEL_COLORS[activeFilter].bg} ${LEVEL_COLORS[activeFilter].text}`}>
                        {t(`levels.${activeFilter}`)}
                    </span>
                )}
                <span className="tabular-nums whitespace-nowrap">{t("study.cardCounter", { current: currentIndex + 1, total: totalCards })}</span>
            </button>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-1 z-10">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onShowGoto}
                    className="h-11 w-11 md:h-9 md:w-9"
                    title={t("study.goToQuestion")}
                    aria-label={t("study.goToQuestion")}
                >
                    <Hash className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onShuffle}
                    className={`h-11 w-11 md:h-9 md:w-9 ${isShuffled ? "text-primary bg-primary/20" : ""}`}
                    title={`Shuffle: ${isShuffled ? "ON" : "OFF"}`}
                    aria-label={isShuffled ? t("study.shuffleOff") : t("study.shuffleOn")}
                >
                    <Shuffle className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onReset}
                    className="h-11 w-11 md:h-9 md:w-9 text-destructive"
                    title={t("study.resetProgress")}
                    aria-label={t("study.resetProgress")}
                >
                    <RotateCcw className="w-4 h-4" />
                </Button>
            </div>
        </header>
    );
}
