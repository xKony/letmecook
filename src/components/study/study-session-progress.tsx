"use client";

import React from "react";

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
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                />
            </div>
        </div>
    );
}
