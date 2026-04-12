"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flashcard as FlashcardType, CardLevel } from "@/lib/types";
import { useApp } from "@/lib/app-context";
import { FLASHCARD_LONG_PRESS_MS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { Pencil, Check, X, ImageOff, ZoomIn } from "lucide-react";

// Dynamically import LatexRenderer as it is only needed when text contains math
const LatexRenderer = dynamic(() => import("@/components/latex-renderer").then(mod => mod.LatexRenderer), {
    ssr: true, // Keep SSR for SEO/initial paint
});

import { FlashcardHeader } from "./flashcard/flashcard-header";
import { FlashcardRating } from "./flashcard/flashcard-rating";
import { useFlashcardImageZoom } from "./flashcard/use-flashcard-image-zoom";
import { FlashcardZoomModal } from "./flashcard/flashcard-zoom-modal";
import { FlashcardContent } from "./flashcard/flashcard-content";

interface FlashcardProps {
    card: FlashcardType;
    deckName: string;
    isRevealed: boolean;
    onReveal: () => void;
    onRate: (level: CardLevel) => void;
    onUpdateCard?: (cardId: string, question: string, answer: string) => void;
    ttsEnabled: boolean;
    onTTSToggle: () => void;
}



export function FlashcardComponent({
    card,
    deckName,
    isRevealed,
    onReveal,
    onRate,
    onUpdateCard,
    ttsEnabled,
    onTTSToggle,
}: FlashcardProps) {
    const { t } = useApp();
    const [isEditingQuestion, setIsEditingQuestion] = useState(false);
    const [isEditingAnswer, setIsEditingAnswer] = useState(false);
    const [editQuestion, setEditQuestion] = useState(card.question);
    const [editAnswer, setEditAnswer] = useState(card.answer);
    const [showEditHint, setShowEditHint] = useState<"question" | "answer" | null>(null);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

    const { openZoom, closeZoom } = useFlashcardImageZoom(zoomedImage, setZoomedImage);

    // Handle long press for mobile
    const handleTouchStart = useCallback((type: "question" | "answer") => {
        longPressTimerRef.current = setTimeout(() => {
            if (type === "question") {
                setEditQuestion(card.question);
                setIsEditingQuestion(true);
            } else {
                setEditAnswer(card.answer);
                setIsEditingAnswer(true);
            }
        }, FLASHCARD_LONG_PRESS_MS);
    }, [card.question, card.answer]);

    const handleTouchEnd = useCallback(() => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    }, []);

    const handleSaveQuestion = () => {
        if (onUpdateCard && editQuestion.trim()) {
            // Replace newlines with spaces to maintain file structure
            const sanitizedQuestion = editQuestion.replace(/[\r\n]+/g, " ").trim();
            onUpdateCard(card.id, sanitizedQuestion, card.answer);
        }
        setIsEditingQuestion(false);
    };

    const handleSaveAnswer = () => {
        if (onUpdateCard) {
            // Replace newlines with spaces to maintain file structure
            const sanitizedAnswer = editAnswer.replace(/[\r\n]+/g, " ").trim();
            onUpdateCard(card.id, card.question, sanitizedAnswer);
        }
        setIsEditingAnswer(false);
    };

    const handleCancelEdit = (type: "question" | "answer") => {
        if (type === "question") {
            setEditQuestion(card.question);
            setIsEditingQuestion(false);
        } else {
            setEditAnswer(card.answer);
            setIsEditingAnswer(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, type: "question" | "answer") => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (type === "question") {
                handleSaveQuestion();
            } else {
                handleSaveAnswer();
            }
        } else if (e.key === "Escape") {
            handleCancelEdit(type);
        }
    };

    return (
        <motion.div
            key={card.id}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-2xl mx-auto"
        >
            {/* Card Container */}
            <div className="relative bg-card rounded-3xl border border-border shadow-xl dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] dark:border-white/5 min-h-[400px] flex flex-col p-8 md:p-12">
                <FlashcardHeader
                    card={card}
                    deckName={deckName}
                    ttsEnabled={ttsEnabled}
                    onTTSToggle={onTTSToggle}
                />

                {/* Question */}
                <motion.div
                    animate={{ y: isRevealed ? -10 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex items-center justify-center relative group"
                    onMouseEnter={() => !isEditingQuestion && setShowEditHint("question")}
                    onMouseLeave={() => setShowEditHint(null)}
                    onTouchStart={() => handleTouchStart("question")}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                >
                    <AnimatePresence mode="wait">
                        {isEditingQuestion ? (
                            <motion.div
                                key="edit-question"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="w-full flex flex-col gap-3"
                            >
                                <textarea
                                    value={editQuestion}
                                    onChange={(e) => setEditQuestion(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, "question")}
                                    autoFocus
                                    className="w-full p-4 text-xl md:text-2xl font-bold text-center bg-background border border-input rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[100px]"
                                    placeholder={t("study.enterQuestion")}
                                />
                                <div className="flex justify-center gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handleSaveQuestion}
                                        className="gap-1"
                                    >
                                        <Check className="w-4 h-4" />
                                        {t("common.save")}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleCancelEdit("question")}
                                        className="gap-1"
                                    >
                                        <X className="w-4 h-4" />
                                        {t("common.cancel")}
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="display-question"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="relative"
                            >
                                <h2 className="text-2xl md:text-3xl font-bold text-center tracking-tight text-foreground">
                                    <FlashcardContent
                                        text={card.question}
                                        isLarge={true}
                                        onImageZoom={openZoom}
                                    />
                                </h2>
                                {/* Edit button - Desktop hover */}
                                <AnimatePresence>
                                    {showEditHint === "question" && onUpdateCard && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.15 }}
                                            onClick={() => {
                                                setEditQuestion(card.question);
                                                setIsEditingQuestion(true);
                                            }}
                                            className="absolute -right-10 top-1/2 -translate-y-1/2 p-2 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors hidden md:flex"
                                            title="Edit question"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Answer */}
                <AnimatePresence>
                    {isRevealed && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="flex-1 flex items-center justify-center border-t border-border pt-6 relative group"
                            onMouseEnter={() => !isEditingAnswer && setShowEditHint("answer")}
                            onMouseLeave={() => setShowEditHint(null)}
                            onTouchStart={() => handleTouchStart("answer")}
                            onTouchEnd={handleTouchEnd}
                            onTouchCancel={handleTouchEnd}
                        >
                            <AnimatePresence mode="wait">
                                {isEditingAnswer ? (
                                    <motion.div
                                        key="edit-answer"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="w-full flex flex-col gap-3"
                                    >
                                        <textarea
                                            value={editAnswer}
                                            onChange={(e) => setEditAnswer(e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, "answer")}
                                            autoFocus
                                            className="w-full p-4 text-lg md:text-xl font-medium text-center bg-background border border-input rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[80px]"
                                            placeholder={t("study.enterAnswer")}
                                        />
                                        <div className="flex justify-center gap-2">
                                            <Button
                                                size="sm"
                                                onClick={handleSaveAnswer}
                                                className="gap-1"
                                            >
                                                <Check className="w-4 h-4" />
                                                {t("common.save")}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleCancelEdit("answer")}
                                                className="gap-1"
                                            >
                                                <X className="w-4 h-4" />
                                                {t("common.cancel")}
                                            </Button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="display-answer"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="relative w-full"
                                    >
                                        <div
                                            aria-live="polite"
                                        >
                                            <FlashcardContent
                                                text={card.answer}
                                                onImageZoom={openZoom}
                                            />
                                            {!card.answer && t("study.mentalAnswer")}
                                        </div>

                                        {/* Edit button - Desktop hover */}
                                        <AnimatePresence>
                                            {showEditHint === "answer" && onUpdateCard && (
                                                <motion.button
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    transition={{ duration: 0.15 }}
                                                    onClick={() => {
                                                        setEditAnswer(card.answer);
                                                        setIsEditingAnswer(true);
                                                    }}
                                                    className="absolute -right-10 top-1/2 -translate-y-1/2 p-2 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors hidden md:flex"
                                                    title={t("study.editAnswer")}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </motion.button>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <FlashcardRating
                isRevealed={isRevealed}
                onReveal={onReveal}
                onRate={onRate}
            />

            <FlashcardZoomModal
                zoomedImage={zoomedImage}
                onClose={closeZoom}
            />
        </motion.div>
    );
}
