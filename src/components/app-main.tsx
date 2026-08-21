"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useApp } from "@/lib/app-context";
import { Dashboard } from "@/components/dashboard";
import { GuestModeBanner } from "@/components/guest-mode-banner";
import { Deck } from "@/lib/types";

// Dynamically import StudySession as it contains heavy libraries (Katex, etc.)
// This prevents them from being part of the initial bundle
const StudySession = dynamic(() => import("@/components/study-session").then(mod => mod.StudySession), {
    loading: () => (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground text-lg">Preparing Study Session...</div>
        </div>
    ),
    ssr: false // Browser-only features
});

interface AppMainProps {
    initialDecks?: Deck[];
    initialMaxDecks?: number;
}

/**
 * Main application component that handles the transition between Dashboard and StudySession.
 * It also syncs server-side fetched data into the global AppProvider context.
 */
export function AppMain({ initialDecks, initialMaxDecks }: AppMainProps) {
    const { currentDeck, isLoading, authLoading, isGuest, setInitialData, t } = useApp();

    // Sync initial data from server to context
    useEffect(() => {
        if (initialDecks && initialMaxDecks !== undefined) {
            setInitialData(initialDecks, initialMaxDecks);
        }
    }, [initialDecks, initialMaxDecks, setInitialData]);

    // Show loading while auth is checking OR if we're waiting for initial data
    // But if we have initial session/decks, we don't show the global spinner
    if ((isLoading || authLoading) && !initialDecks) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">{t("common.loading")}</div>
            </div>
        );
    }

    // Direct to Dashboard or StudySession
    return (
        <>
            {isGuest && <GuestModeBanner />}
            {currentDeck ? <StudySession /> : <Dashboard />}
        </>
    );
}
