"use client";

import { useApp } from "@/lib/app-context";
import { Dashboard } from "@/components/dashboard";
import { StudySession } from "@/components/study-session";
import { GuestModeBanner } from "@/components/guest-mode-banner";

export function AppMain() {
    const { currentDeck, isLoading, authLoading, isGuest, t } = useApp();

    // Show loading while auth is checking or localStorage is loading
    if (isLoading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">{t("common.loading")}</div>
            </div>
        );
    }

    // Direct to Dashboard or StudySession (no more profile selector)
    return (
        <>
            {isGuest && <GuestModeBanner />}
            {currentDeck ? <StudySession /> : <Dashboard />}
        </>
    );
}
