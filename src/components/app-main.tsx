"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useApp } from "@/lib/app-context";
import { useI18n } from "@/lib/i18n-context";
import { Dashboard } from "@/components/dashboard";
import { GuestModeBanner } from "@/components/guest-mode-banner";
import type { Session } from "next-auth";
import { Deck } from "@/lib/types";

const StudySession = dynamic(() => import("@/components/study-session").then(mod => mod.StudySession), {
    loading: () => (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground text-lg">Preparing Study Session...</div>
        </div>
    ),
    ssr: false
});

const DeckSetEditorModal = dynamic(
    () => import("@/components/dashboard/deck-set-editor-modal").then((m) => m.DeckSetEditorModal),
    { ssr: false }
);

interface AppMainProps {
    initialDecks?: Deck[];
    initialMaxDecks?: number;
    session?: Session | null;
}

/**
 * Main application component that handles the transition between Dashboard and StudySession.
 * It also syncs server-side fetched data into the global AppProvider context.
 */
export function AppMain({ initialDecks, initialMaxDecks }: AppMainProps) {
    const { currentDeck, isLoading, authLoading, isGuest, setInitialData } = useApp();
    const { t } = useI18n();

    useEffect(() => {
        if (initialDecks && initialMaxDecks !== undefined) {
            setInitialData(initialDecks, initialMaxDecks);
        }
    }, [initialDecks, initialMaxDecks, setInitialData]);

    if ((isLoading || authLoading) && !initialDecks) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">{t("common.loading")}</div>
            </div>
        );
    }

    return (
        <>
            {isGuest && <GuestModeBanner />}
            {currentDeck ? <StudySession /> : <Dashboard />}
            <DeckSetEditorModal />
        </>
    );
}
