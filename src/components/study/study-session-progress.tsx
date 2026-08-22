"use client";

import React from "react";
import { ProgressBar } from "@/components/ui/progress-bar";

interface StudySessionProgressProps {
    currentIndex: number;
    totalCards: number;
}

/**
 * Progress bar component for the study session.
 *
 * @param currentIndex The current card index (0-based).
 * @param totalCards The total number of cards in the session.
 */
export function StudySessionProgress({ currentIndex, totalCards }: StudySessionProgressProps) {
    if (totalCards === 0) return null;

    const progress = ((currentIndex + 1) / totalCards) * 100;

    return (
        <div className="max-w-2xl mx-auto w-full mb-6">
            <ProgressBar value={progress} />
        </div>
    );
}
