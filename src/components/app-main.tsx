"use client";

import { useApp } from "@/lib/app-context";
import { LoginScreen } from "@/components/login-screen";
import { Dashboard } from "@/components/dashboard";
import { StudySession } from "@/components/study-session";

export function AppMain() {
    const { currentUser, currentDeck, isLoading } = useApp();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }

    // No user logged in
    if (!currentUser) {
        return <LoginScreen />;
    }

    // User logged in, deck selected
    if (currentDeck) {
        return <StudySession />;
    }

    // User logged in, no deck selected
    return <Dashboard />;
}
