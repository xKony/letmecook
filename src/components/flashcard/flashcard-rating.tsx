"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CardLevel, RATINGS } from "@/lib/types";
import { useI18n } from "@/lib/i18n-context";
import { RATING_STYLES } from "@/lib/level-styles";
import { Button } from "@/components/ui/button";

/**
 * Props for the FlashcardRating component.
 */
interface FlashcardRatingProps {
    /** Whether the answer is currently revealed. */
    isRevealed: boolean;
    /** Callback to reveal the answer. */
    onReveal: () => void;
    /** Callback to rate the card. */
    onRate: (level: CardLevel) => void;
}

/**
 * Renders the rating controls for the flashcard.
 * If not revealed, shows a "Reveal" button.
 * If revealed, shows the rating buttons (Again, Hard, Good, Easy).
 * 
 * @param props - Component props.
 * @returns The rendered rating controls.
 */
export function FlashcardRating({
    isRevealed,
    onReveal,
    onRate,
}: FlashcardRatingProps) {
    const { t } = useI18n();

    return (
        <div className="mt-6 space-y-4">
            <AnimatePresence mode="wait">
                {!isRevealed ? (
                    <motion.div
                        key="reveal"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <Button
                            onClick={onReveal}
                            className="w-full h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {t("study.reveal")}
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="rating"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-3"
                    >
                        {RATINGS.map((rating) => (
                            <Button
                                key={rating.value}
                                onClick={() => onRate(rating.value)}
                                variant="outline"
                                className={`h-16 rounded-xl border-2 transition-all font-medium ${RATING_STYLES[rating.value]}`}
                            >
                                {t(`ratings.${rating.value}`)}
                            </Button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
