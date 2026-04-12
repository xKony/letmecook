"use client";

import { useState, useRef, useCallback } from "react";
import { Flashcard as FlashcardType } from "@/lib/types";
import { FLASHCARD_LONG_PRESS_MS } from "@/lib/constants";

/**
 * Options for the useFlashcardEdit hook.
 */
interface UseFlashcardEditOptions {
    /** The current flashcard. */
    card: FlashcardType;
    /** Optional callback to update the card. */
    onUpdateCard?: (cardId: string, question: string, answer: string) => void;
}

/**
 * Hook to manage the editing state and logic for a flashcard.
 * Handles both desktop (hover/click) and mobile (long press) edit triggers.
 * 
 * @param options - Hook options.
 * @returns Editing state and event handlers.
 */
export function useFlashcardEdit({
    card,
    onUpdateCard,
}: UseFlashcardEditOptions) {
    const [isEditingQuestion, setIsEditingQuestion] = useState(false);
    const [isEditingAnswer, setIsEditingAnswer] = useState(false);
    const [editQuestion, setEditQuestion] = useState(card.question);
    const [editAnswer, setEditAnswer] = useState(card.answer);
    const [showEditHint, setShowEditHint] = useState<"question" | "answer" | null>(null);

    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    const handleSaveQuestion = useCallback(() => {
        if (onUpdateCard && editQuestion.trim()) {
            // Replace newlines with spaces to maintain file structure
            const sanitizedQuestion = editQuestion.replace(/[\r\n]+/g, " ").trim();
            onUpdateCard(card.id, sanitizedQuestion, card.answer);
        }
        setIsEditingQuestion(false);
    }, [card.id, card.answer, editQuestion, onUpdateCard]);

    const handleSaveAnswer = useCallback(() => {
        if (onUpdateCard) {
            // Replace newlines with spaces to maintain file structure
            const sanitizedAnswer = editAnswer.replace(/[\r\n]+/g, " ").trim();
            onUpdateCard(card.id, card.question, sanitizedAnswer);
        }
        setIsEditingAnswer(false);
    }, [card.id, card.question, editAnswer, onUpdateCard]);

    const handleCancelEdit = useCallback((type: "question" | "answer") => {
        if (type === "question") {
            setEditQuestion(card.question);
            setIsEditingQuestion(false);
        } else {
            setEditAnswer(card.answer);
            setIsEditingAnswer(false);
        }
    }, [card.question, card.answer]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent, type: "question" | "answer") => {
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
    }, [handleSaveQuestion, handleSaveAnswer, handleCancelEdit]);

    const startEditing = useCallback((type: "question" | "answer") => {
        if (type === "question") {
            setEditQuestion(card.question);
            setIsEditingQuestion(true);
        } else {
            setEditAnswer(card.answer);
            setIsEditingAnswer(true);
        }
    }, [card.question, card.answer]);

    return {
        isEditingQuestion,
        isEditingAnswer,
        editQuestion,
        editAnswer,
        setEditQuestion,
        setEditAnswer,
        showEditHint,
        setShowEditHint,
        handleTouchStart,
        handleTouchEnd,
        handleSaveQuestion,
        handleSaveAnswer,
        handleCancelEdit,
        handleKeyDown,
        startEditing,
    };
}
