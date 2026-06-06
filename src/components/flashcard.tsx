"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flashcard as FlashcardType, CardLevel } from "@/lib/types";
import { useI18n } from "@/lib/i18n-context";
import { Pencil } from "lucide-react";

import { FlashcardHeader } from "./flashcard/flashcard-header";
import { FlashcardRating } from "./flashcard/flashcard-rating";
import { useFlashcardImageZoom } from "./flashcard/use-flashcard-image-zoom";
import { FlashcardZoomModal } from "./flashcard/flashcard-zoom-modal";
import { FlashcardContent } from "./flashcard/flashcard-content";
import { useFlashcardEdit } from "./flashcard/use-flashcard-edit";
import { FlashcardEditor } from "./flashcard/flashcard-editor";
import { FlashcardMobileEditBar } from "./flashcard/flashcard-mobile-edit-bar";

/**
 * Props for the FlashcardComponent.
 */
interface FlashcardProps {
    /** The flashcard data to display. */
    card: FlashcardType;
    /** The name of the deck this card belongs to. */
    deckName: string;
    /** Whether the answer is currently revealed. */
    isRevealed: boolean;
    /** Callback to reveal the answer. */
    onReveal: () => void;
    /** Callback to rate the card's difficulty. */
    onRate: (level: CardLevel) => void;
    /** Optional callback to update the card's content. */
    onUpdateCard?: (cardId: string, question: string, answer: string) => void;
    /** Whether Text-to-Speech is enabled. */
    ttsEnabled: boolean;
    /** Callback to toggle TTS state. */
    onTTSToggle: () => void;
}

/**
 * The primary component for displaying and interacting with a flashcard.
 * Handles display, editing, rating, and image zooming.
 * 
 * @param props - Component props.
 * @returns The rendered flashcard.
 */
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
    const { t } = useI18n();
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    const { openZoom, closeZoom } = useFlashcardImageZoom(zoomedImage, setZoomedImage);
    const {
        isEditingQuestion,
        isEditingAnswer,
        editQuestion,
        editAnswer,
        setEditQuestion,
        setEditAnswer,
        showEditHint,
        showEditHintFor,
        scheduleHideEditHint,
        showMobileEditMenu,
        dismissMobileEditMenu,
        handleCardTouchStart,
        handleCardTouchMove,
        handleCardTouchEnd,
        handleSaveQuestion,
        handleSaveAnswer,
        handleCancelEdit,
        handleKeyDown,
        startEditing,
    } = useFlashcardEdit({ card, onUpdateCard });

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
            <div
                className="relative bg-card rounded-3xl border border-border shadow-xl dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] dark:border-white/5 min-h-[400px] flex flex-col p-8 md:p-12"
                onTouchStart={onUpdateCard ? handleCardTouchStart : undefined}
                onTouchMove={onUpdateCard ? handleCardTouchMove : undefined}
                onTouchEnd={onUpdateCard ? handleCardTouchEnd : undefined}
                onTouchCancel={onUpdateCard ? handleCardTouchEnd : undefined}
            >
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
                    onMouseEnter={() => showEditHintFor("question")}
                    onMouseLeave={scheduleHideEditHint}
                >
                    <AnimatePresence mode="wait">
                        {isEditingQuestion ? (
                            <FlashcardEditor
                                value={editQuestion}
                                onChange={setEditQuestion}
                                onSave={handleSaveQuestion}
                                onCancel={() => handleCancelEdit("question")}
                                onKeyDown={(e) => handleKeyDown(e, "question")}
                                placeholder={t("study.enterQuestion")}
                                isQuestion={true}
                            />
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
                                {/* Edit button - Desktop hover (outside text, symmetric layout) */}
                                <AnimatePresence>
                                    {showEditHint === "question" && onUpdateCard && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                            onClick={() => startEditing("question")}
                                            onMouseEnter={() => showEditHintFor("question")}
                                            onMouseLeave={scheduleHideEditHint}
                                            className="absolute -right-10 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-muted/90 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors hidden md:flex shadow-sm"
                                            title={t("study.editQuestion")}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Dedicated Card Image */}
                {card.image && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="my-4 flex justify-center"
                    >
                        <FlashcardContent
                            text={`[img:${card.image}]`}
                            onImageZoom={openZoom}
                        />
                    </motion.div>
                )}

                {/* Answer */}
                <AnimatePresence>
                    {isRevealed && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="flex-1 flex items-center justify-center border-t border-border pt-6 relative group"
                            onMouseEnter={() => showEditHintFor("answer")}
                            onMouseLeave={scheduleHideEditHint}
                        >
                            <AnimatePresence mode="wait">
                                {isEditingAnswer ? (
                                    <FlashcardEditor
                                        value={editAnswer}
                                        onChange={setEditAnswer}
                                        onSave={handleSaveAnswer}
                                        onCancel={() => handleCancelEdit("answer")}
                                        onKeyDown={(e) => handleKeyDown(e, "answer")}
                                        placeholder={t("study.enterAnswer")}
                                    />
                                ) : (
                                    <motion.div
                                        key="display-answer"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="relative w-full"
                                    >
                                        <div aria-live="polite">
                                            <FlashcardContent
                                                text={card.answer}
                                                onImageZoom={openZoom}
                                            />
                                            {!card.answer && t("study.mentalAnswer")}
                                        </div>

                                        {/* Edit button - Desktop hover (outside text, symmetric layout) */}
                                        <AnimatePresence>
                                            {showEditHint === "answer" && onUpdateCard && (
                                                <motion.button
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    transition={{ duration: 0.2 }}
                                                    onClick={() => startEditing("answer")}
                                                    onMouseEnter={() => showEditHintFor("answer")}
                                                    onMouseLeave={scheduleHideEditHint}
                                                    className="absolute -right-10 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-muted/90 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors hidden md:flex shadow-sm"
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

                {onUpdateCard && (
                    <FlashcardMobileEditBar
                        isOpen={showMobileEditMenu}
                        isRevealed={isRevealed}
                        onEditQuestion={() => startEditing("question")}
                        onEditAnswer={() => startEditing("answer")}
                        onDismiss={dismissMobileEditMenu}
                    />
                )}
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
