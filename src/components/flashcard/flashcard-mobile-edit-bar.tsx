"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/app-context";

interface FlashcardMobileEditBarProps {
    isOpen: boolean;
    isRevealed: boolean;
    onEditQuestion: () => void;
    onEditAnswer: () => void;
    onDismiss: () => void;
}

/**
 * Mobile-only action bar shown after long-press on a flashcard.
 * User must explicitly tap an edit action — no accidental inline editing.
 */
export function FlashcardMobileEditBar({
    isOpen,
    isRevealed,
    onEditQuestion,
    onEditAnswer,
    onDismiss,
}: FlashcardMobileEditBarProps) {
    const { t } = useApp();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.button
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="md:hidden absolute inset-0 z-10 rounded-3xl bg-black/25"
                        aria-label={t("common.cancel")}
                        onClick={onDismiss}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="md:hidden absolute bottom-0 left-0 right-0 z-20 p-3 border-t border-border bg-card/95 backdrop-blur-md rounded-b-3xl shadow-[0_-8px_24px_rgba(0,0,0,0.12)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="secondary"
                                className="w-full justify-start gap-2 h-11"
                                onClick={onEditQuestion}
                            >
                                <Pencil className="w-4 h-4 shrink-0" />
                                {t("study.editQuestion")}
                            </Button>
                            {isRevealed && (
                                <Button
                                    variant="secondary"
                                    className="w-full justify-start gap-2 h-11"
                                    onClick={onEditAnswer}
                                >
                                    <Pencil className="w-4 h-4 shrink-0" />
                                    {t("study.editAnswer")}
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                className="w-full h-10"
                                onClick={onDismiss}
                            >
                                {t("common.cancel")}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
