"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Flashcard as FlashcardType } from "@/lib/types";
import {
    FLASHCARD_LONG_PRESS_MS,
    FLASHCARD_TOUCH_MOVE_CANCEL_PX,
    FLASHCARD_EDIT_HINT_HIDE_MS,
} from "@/lib/constants";

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
 * Desktop: hover + pencil click. Mobile: long-press opens edit menu at card bottom.
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
    const [showMobileEditMenu, setShowMobileEditMenu] = useState(false);
    const [syncedCardKey, setSyncedCardKey] = useState(
        () => `${card.id}:${card.question}:${card.answer}`
    );

    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hideEditHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    const clearHideEditHintTimer = useCallback(() => {
        if (hideEditHintTimerRef.current) {
            clearTimeout(hideEditHintTimerRef.current);
            hideEditHintTimerRef.current = null;
        }
    }, []);

    const showEditHintFor = useCallback(
        (type: "question" | "answer") => {
            clearHideEditHintTimer();
            if (type === "question" && !isEditingQuestion) {
                setShowEditHint("question");
            } else if (type === "answer" && !isEditingAnswer) {
                setShowEditHint("answer");
            }
        },
        [isEditingQuestion, isEditingAnswer, clearHideEditHintTimer]
    );

    const scheduleHideEditHint = useCallback(() => {
        clearHideEditHintTimer();
        hideEditHintTimerRef.current = setTimeout(() => {
            setShowEditHint(null);
            hideEditHintTimerRef.current = null;
        }, FLASHCARD_EDIT_HINT_HIDE_MS);
    }, [clearHideEditHintTimer]);

    const cardKey = `${card.id}:${card.question}:${card.answer}`;
    if (cardKey !== syncedCardKey) {
        setSyncedCardKey(cardKey);
        setShowMobileEditMenu(false);
        setIsEditingQuestion(false);
        setIsEditingAnswer(false);
        setEditQuestion(card.question);
        setEditAnswer(card.answer);
        setShowEditHint(null);
    }

    useEffect(() => {
        clearHideEditHintTimer();
    }, [cardKey, clearHideEditHintTimer]);

    useEffect(() => {
        return () => clearHideEditHintTimer();
    }, [clearHideEditHintTimer]);

    const clearLongPressTimer = useCallback(() => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    }, []);

    const dismissMobileEditMenu = useCallback(() => {
        setShowMobileEditMenu(false);
    }, []);

    const handleCardTouchStart = useCallback(
        (e: React.TouchEvent) => {
            if (!onUpdateCard || isEditingQuestion || isEditingAnswer) return;

            const touch = e.touches[0];
            touchStartRef.current = { x: touch.clientX, y: touch.clientY };

            clearLongPressTimer();
            longPressTimerRef.current = setTimeout(() => {
                setShowMobileEditMenu(true);
                if (typeof navigator !== "undefined" && navigator.vibrate) {
                    navigator.vibrate(30);
                }
            }, FLASHCARD_LONG_PRESS_MS);
        },
        [onUpdateCard, isEditingQuestion, isEditingAnswer, clearLongPressTimer]
    );

    const handleCardTouchMove = useCallback(
        (e: React.TouchEvent) => {
            if (!touchStartRef.current || !longPressTimerRef.current) return;

            const touch = e.touches[0];
            const dx = Math.abs(touch.clientX - touchStartRef.current.x);
            const dy = Math.abs(touch.clientY - touchStartRef.current.y);

            if (
                dx > FLASHCARD_TOUCH_MOVE_CANCEL_PX ||
                dy > FLASHCARD_TOUCH_MOVE_CANCEL_PX
            ) {
                clearLongPressTimer();
            }
        },
        [clearLongPressTimer]
    );

    const handleCardTouchEnd = useCallback(() => {
        touchStartRef.current = null;
        clearLongPressTimer();
    }, [clearLongPressTimer]);

    const handleSaveQuestion = useCallback(() => {
        if (onUpdateCard && editQuestion.trim()) {
            onUpdateCard(card.id, editQuestion.trim(), card.answer);
        }
        setIsEditingQuestion(false);
        setShowMobileEditMenu(false);
    }, [card.id, card.answer, editQuestion, onUpdateCard]);

    const handleSaveAnswer = useCallback(() => {
        if (onUpdateCard) {
            onUpdateCard(card.id, card.question, editAnswer.trim());
        }
        setIsEditingAnswer(false);
        setShowMobileEditMenu(false);
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
        setShowMobileEditMenu(false);
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
    };
}
