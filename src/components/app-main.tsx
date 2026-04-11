"use client";

import dynamic from "next/dynamic";
import { useApp } from "@/lib/app-context";
import { Dashboard } from "@/components/dashboard";
import { GuestModeBanner } from "@/components/guest-mode-banner";
import type { Session } from "next-auth";
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
    session?: Session | null;
}

export function AppMain({ initialDecks }: AppMainProps) {
    const { currentDeck, isLoading, authLoading, isGuest, t } = useApp();

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
