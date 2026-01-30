"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flashcard as FlashcardType, CardLevel, RATINGS } from "@/lib/types";
import { LEVEL_COLORS, RATING_STYLES } from "@/lib/level-styles";
import { FLASHCARD_LONG_PRESS_MS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { LatexRenderer } from "@/components/latex-renderer";
import { Volume2, VolumeX, Pencil, Check, X, ImageOff, ZoomIn } from "lucide-react";

interface FlashcardProps {
    card: FlashcardType;
    deckName: string;
    isRevealed: boolean;
    onReveal: () => void;
    onRate: (level: CardLevel) => void;
    onUpdateCard?: (cardId: string, question: string, answer: string) => void;
    ttsEnabled: boolean;
    onTTSToggle: () => void;
    onSpeak: (text: string) => void;
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
    onSpeak,
}: FlashcardProps) {
    const [isEditingQuestion, setIsEditingQuestion] = useState(false);
    const [isEditingAnswer, setIsEditingAnswer] = useState(false);
    const [editQuestion, setEditQuestion] = useState(card.question);
    const [editAnswer, setEditAnswer] = useState(card.answer);
    const [showEditHint, setShowEditHint] = useState<"question" | "answer" | null>(null);
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Reset image states when card changes
    useEffect(() => {
        setImageErrors(new Set());
        setZoomedImage(null);
    }, [card.id]);

    // Close zoom modal on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && zoomedImage) {
                setZoomedImage(null);
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [zoomedImage]);

    // Parse [img:URL] syntax and render content with inline images
    const renderContent = useCallback((text: string, isLarge: boolean = false) => {
        if (!text) return null;

        // Split by [img:...] pattern, keeping the delimiters
        const parts = text.split(/(\[img:.*?\])/g);

        return (
            <div className={`flex flex-col items-center gap-3 ${isLarge ? '' : ''}`}>
                {parts.map((part, index) => {
                    const imgMatch = part.match(/\[img:(.*?)\]/);
                    if (imgMatch) {
                        const imageUrl = imgMatch[1];
                        const hasError = imageErrors.has(imageUrl);

                        if (hasError) {
                            return (
                                <div key={index} className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <ImageOff className="w-4 h-4" />
                                    <span>Image failed to load</span>
                                </div>
                            );
                        }

                        return (
                            <div key={index} className="relative group/img">
                                <img
                                    src={imageUrl}
                                    alt="Flashcard image"
                                    className={`rounded-lg cursor-zoom-in shadow-md hover:shadow-lg transition-shadow ${isLarge ? 'max-h-48' : 'max-h-32'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setZoomedImage(imageUrl);
                                    }}
                                    onError={() => setImageErrors(prev => new Set(prev).add(imageUrl))}
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/20 rounded-lg pointer-events-none">
                                    <ZoomIn className="w-6 h-6 text-white drop-shadow-lg" />
                                </div>
                            </div>
                        );
                    }

                    // Regular text part - render with LaTeX support
                    if (part.trim()) {
                        return <LatexRenderer key={index} text={part} />;
                    }
                    return null;
                })}
            </div>
        );
    }, [imageErrors]);

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
            onUpdateCard(card.id, editQuestion.trim(), card.answer);
        }
        setIsEditingQuestion(false);
    };

    const handleSaveAnswer = () => {
        if (onUpdateCard) {
            onUpdateCard(card.id, card.question, editAnswer);
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
                {/* Deck Name Indicator */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                        {deckName}
                    </span>
                </div>

                {/* Status Label with Color Dot */}
                <div className="flex justify-between items-center mb-4 mt-2">
                    <button
                        onClick={onTTSToggle}
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
                            {card.level}
                        </span>
                    </div>
                </div>

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
                                    placeholder="Enter question..."
                                />
                                <div className="flex justify-center gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handleSaveQuestion}
                                        className="gap-1"
                                    >
                                        <Check className="w-4 h-4" />
                                        Save
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleCancelEdit("question")}
                                        className="gap-1"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel
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
                                    {renderContent(card.question, true)}
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
                                            placeholder="Enter answer..."
                                        />
                                        <div className="flex justify-center gap-2">
                                            <Button
                                                size="sm"
                                                onClick={handleSaveAnswer}
                                                className="gap-1"
                                            >
                                                <Check className="w-4 h-4" />
                                                Save
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleCancelEdit("answer")}
                                                className="gap-1"
                                            >
                                                <X className="w-4 h-4" />
                                                Cancel
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
                                            className="text-xl md:text-2xl font-medium text-center text-muted-foreground"
                                            aria-live="polite"
                                        >
                                            {renderContent(card.answer, false) || "(Mental Answer)"}
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
                                                    title="Edit answer"
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

            {/* Controls */}
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
                                Show Answer (Space)
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
                                    {rating.label}
                                </Button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Image Zoom Modal */}
            <AnimatePresence>
                {zoomedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                        onClick={() => setZoomedImage(null)}
                    >
                        <motion.img
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            src={zoomedImage}
                            alt="Zoomed flashcard image"
                            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            onClick={() => setZoomedImage(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <p className="absolute bottom-4 text-white/50 text-sm">
                            Click anywhere or press Escape to close
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
