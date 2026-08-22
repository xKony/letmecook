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
        <div className="relative z-10 mt-3 space-y-3 md:mt-5 w-full">
            <AnimatePresence mode="wait" initial={false}>
                {!isRevealed ? (
                    <motion.div
                        key="reveal"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, pointerEvents: "none" }}
                    >
                        <Button
                            onClick={onReveal}
                            className="w-full h-12 md:h-14 rounded-full bg-gradient-to-b from-primary to-primary/85 text-primary-foreground font-semibold text-lg shadow-lg shadow-primary/30 transition-[transform,filter,box-shadow] duration-200 ease-out [@media(hover:hover)]:hover:brightness-110 [@media(hover:hover)]:hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {t("study.reveal")}
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="rating"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, pointerEvents: "none" }}
                        className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3"
                    >
                        {RATINGS.map((rating) => (
                            <Button
                                key={rating.value}
                                onClick={() => onRate(rating.value)}
                                variant="outline"
                                className={`h-12 md:h-14 [@media(min-height:820px)]:md:h-16 rounded-xl border-2 transition-colors duration-150 active:scale-[0.98] font-medium ${RATING_STYLES[rating.value]}`}
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
