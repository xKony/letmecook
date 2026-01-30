"use client";

import { useApp } from "@/lib/app-context";
import { LoginScreen } from "@/components/login-screen";
import { Dashboard } from "@/components/dashboard";
import { StudySession } from "@/components/study-session";
import { GuestModeBanner } from "@/components/guest-mode-banner";

export function AppMain() {
    const { currentUser, currentDeck, isLoading, isAuthenticated } = useApp();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }

    // No user logged in (local profile)
    if (!currentUser) {
        return <LoginScreen />;
    }

    // Render with guest banner for non-authenticated users
    return (
        <>
            {!isAuthenticated && <GuestModeBanner />}
            {currentDeck ? <StudySession /> : <Dashboard />}
        </>
    );
}

