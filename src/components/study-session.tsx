"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/app-context";
import { useI18n } from "@/lib/i18n-context";
import { useTTS } from "@/hooks/use-tts";
import { FlashcardComponent } from "@/components/flashcard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CardLevel } from "@/lib/types";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { BREAK_REMINDER_INTERVAL_SECONDS } from "@/lib/constants";

// New custom hooks
import { 
    useStudySession, 
    useSessionTimer, 
    useSessionShortcuts 
} from "@/hooks/use-study-session";

// New sub-components
import { StudySessionHeader } from "./study/study-session-header";
import { StudySessionProgress } from "./study/study-session-progress";
import { StudySessionStatsModal } from "./study/study-session-stats-modal";
import { StudySessionGotoModal } from "./study/study-session-goto-modal";
import { StudySessionBreakModal } from "./study/study-session-break-modal";
import { StudySessionEmptyState } from "./study/study-session-empty-state";

/**
 * The main study session component that orchestrates the flashcard learning experience.
 * It manages the session state, timer, shortcuts, and various UI sub-components.
 */
export function StudySession() {
    const { 
        currentDeck, 
        closeDeck, 
        resetCurrentDeck, 
        updateCardLevel, 
        updateCard, 
    } = useApp();
    const { t } = useI18n();
    
    const { 
        enabled: ttsEnabled, 
        speak, 
        toggle: toggleTTS 
    } = useTTS();

    // Core session logic hook
    const {
        playIndex,
        playOrder,
        filteredCards,
        currentCard,
        isShuffled,
        activeFilter,
        searchQuery,
        isRevealed,
        stats,
        maxCount,
        setIsRevealed,
        setActiveFilter,
        setSearchQuery,
        clearFilters,
        handleNext,
        handlePrev,
        handleShuffle,
        handleGoto,
        handleGotoByCardId,
        restart,
    } = useStudySession(currentDeck);

    // Timer logic hook
    const {
        seconds,
        showBreakModal,
        setShowBreakModal,
        formatTime,
    } = useSessionTimer(BREAK_REMINDER_INTERVAL_SECONDS);

    // Modal visibility state
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [showGotoModal, setShowGotoModal] = useState(false);
    const [showRestartModal, setShowRestartModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);

    // TTS effect for current card
    useEffect(() => {
        if (currentCard && ttsEnabled) {
            speak(currentCard.question);
        }
    }, [currentCard, ttsEnabled, speak]);

    /**
     * Handle revealing the card answer and triggering TTS if enabled.
     */
    const onReveal = useCallback(() => {
        setIsRevealed(true);
        if (currentCard && ttsEnabled) {
            speak(currentCard.answer);
        }
    }, [currentCard, ttsEnabled, speak, setIsRevealed]);

    /**
     * Handle rating a card and moving to the next one.
     */
    const onRate = useCallback((level: CardLevel) => {
        if (currentCard) {
            updateCardLevel(currentCard.id, level);
        }
        handleNext(() => setShowRestartModal(true));
    }, [currentCard, updateCardLevel, handleNext]);

    // Keyboard shortcuts hook
    useSessionShortcuts(
        isRevealed,
        showStatsModal || showGotoModal || showRestartModal || showResetModal || showBreakModal,
        {
            onReveal,
            onNext: () => handleNext(() => setShowRestartModal(true)),
            onPrev: handlePrev,
            onRate,
            onShowGoto: () => setShowGotoModal(true),
        }
    );

    if (!currentDeck) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">{t("study.noDeckSelected")}</p>
            </div>
        );
    }

    // Empty state view
    if (playOrder.length === 0) {
        return (
            <StudySessionEmptyState
                activeFilter={activeFilter}
                hasSearch={searchQuery.trim().length > 0}
                totalCardsInDeck={currentDeck.cards.length}
                onResetFilter={clearFilters}
                onBackToDashboard={closeDeck}
                t={t}
            />
        );
    }

    return (
        <div className="min-h-screen flex flex-col p-4 md:p-8">
            {/* Confirmation Modals */}
            <ConfirmationModal
                isOpen={showRestartModal}
                title={t("study.endOfDeck")}
                description={t("study.endOfDeckDescription")}
                confirmLabel={t("common.restart")}
                onConfirm={() => {
                    restart();
                    setShowRestartModal(false);
                }}
                onCancel={() => setShowRestartModal(false)}
            />

            <ConfirmationModal
                isOpen={showResetModal}
                title={t("study.resetProgress")}
                description={t("study.resetProgressDescription")}
                confirmLabel={t("common.delete")}
                variant="destructive"
                onConfirm={() => {
                    resetCurrentDeck();
                    setShowResetModal(false);
                }}
                onCancel={() => setShowResetModal(false)}
            />

            {/* Specialized Study Modals */}
            <StudySessionStatsModal
                isOpen={showStatsModal}
                onClose={() => setShowStatsModal(false)}
                stats={stats}
                maxCount={maxCount}
                activeFilter={activeFilter}
                searchQuery={searchQuery}
                totalCards={currentDeck.cards.length}
                filteredCards={filteredCards}
                playOrder={playOrder}
                onSearchChange={setSearchQuery}
                onFilterSelect={(level) => {
                    setActiveFilter(level);
                    setShowStatsModal(false);
                }}
                onCardSelect={(cardId) => {
                    handleGotoByCardId(cardId);
                    setShowStatsModal(false);
                }}
                onClearFilters={() => {
                    clearFilters();
                    setShowStatsModal(false);
                }}
                t={t}
            />

            <StudySessionGotoModal
                isOpen={showGotoModal}
                onClose={() => setShowGotoModal(false)}
                totalCards={playOrder.length}
                onGoto={handleGoto}
                t={t}
            />

            <StudySessionBreakModal
                isOpen={showBreakModal}
                onClose={() => setShowBreakModal(false)}
                formattedTime={formatTime(seconds)}
                onTakeBreak={() => {
                    setShowBreakModal(false);
                    closeDeck();
                }}
                t={t}
            />

            {/* UI Layout */}
            <StudySessionHeader
                currentIndex={playIndex}
                totalCards={playOrder.length}
                formattedTime={formatTime(seconds)}
                isShuffled={isShuffled}
                activeFilter={activeFilter}
                searchQuery={searchQuery}
                onClose={closeDeck}
                onShowStats={() => setShowStatsModal(true)}
                onShowGoto={() => setShowGotoModal(true)}
                onShuffle={handleShuffle}
                onReset={() => setShowResetModal(true)}
                t={t}
            />

            <StudySessionProgress 
                currentIndex={playIndex} 
                totalCards={playOrder.length} 
            />

            <main className="flex-1 flex items-center justify-center" aria-label={t("study.cardArea")}>
                <AnimatePresence mode="wait">
                    {currentCard && (
                        <FlashcardComponent
                            key={currentCard.id}
                            card={currentCard}
                            deckName={currentDeck.name}
                            isRevealed={isRevealed}
                            onReveal={onReveal}
                            onRate={onRate}
                            onUpdateCard={updateCard}
                            ttsEnabled={ttsEnabled}
                            onTTSToggle={toggleTTS}
                        />
                    )}
                </AnimatePresence>
            </main>

            {/* Bottom Navigation */}
            <footer className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent md:relative md:bg-transparent md:mt-6">
                <div className="max-w-2xl mx-auto flex justify-between gap-4">
                    <Button
                        variant="outline"
                        onClick={handlePrev}
                        disabled={playIndex === 0}
                        className="flex-1 md:flex-none md:w-32 h-12"
                        aria-label={t("study.previous")}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                        {t("study.previous")}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleNext(() => setShowRestartModal(true))}
                        className="flex-1 md:flex-none md:w-32 h-12"
                        aria-label={t("study.next")}
                    >
                        {t("study.next")}
                        <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                    </Button>
                </div>
            </footer>

            {/* Spacer for fixed bottom nav on mobile */}
            <div className="h-20 md:hidden" aria-hidden="true" />
        </div>
    );
}
