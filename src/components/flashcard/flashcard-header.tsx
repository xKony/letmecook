"use client";

import { Volume2, VolumeX } from "lucide-react";
import { Flashcard as FlashcardType } from "@/lib/types";
import { useI18n } from "@/lib/i18n-context";
import { LEVEL_COLORS } from "@/lib/level-styles";

/**
 * Props for the FlashcardHeader component.
 */
interface FlashcardHeaderProps {
    /** The flashcard data. */
    card: FlashcardType;
    /** The name of the deck this card belongs to. */
    deckName: string;
    /** Whether Text-to-Speech is currently enabled. */
    ttsEnabled: boolean;
    /** Callback to toggle TTS state. */
    onTTSToggle: () => void;
}

/**
 * Renders the top section of the flashcard, including the deck name,
 * TTS toggle button, and the card's current level indicator.
 * 
 * @param props - Component props.
 * @returns The rendered header component.
 */
export function FlashcardHeader({
    card,
    deckName,
    ttsEnabled,
    onTTSToggle,
}: FlashcardHeaderProps) {
    const { t } = useI18n();

    return (
        <>
            {/* Deck Name Indicator */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
                <span className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                    {deckName}
                </span>
            </div>

            {/* Status Label with Color Dot */}
            <div className="flex justify-between items-center mb-4 mt-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onTTSToggle();
                    }}
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                    aria-label={ttsEnabled ? "Disable TTS" : "Enable TTS"}
                >
                    {ttsEnabled ? (
                        <Volume2 className="w-5 h-5 text-primary" />
                    ) : (
                        <VolumeX className="w-5 h-5 text-muted-foreground" />
                    )}
                </button>
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${LEVEL_COLORS[card.level].dot}`} />
                    <span className={`text-sm font-medium ${LEVEL_COLORS[card.level].text}`}>
                        {t(`levels.${card.level}`)}
                    </span>
                </div>
            </div>
        </>
    );
}
