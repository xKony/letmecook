"use client";

import { useRouter } from "next/navigation";
import { User, HelpCircle, Shield, Settings, LogIn, LogOut } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Component as LanguageSelectorDropdown } from "@/components/ui/language-selector-dropdown";

/**
 * Header component for the dashboard, containing user info, language/theme toggles, and navigation actions.
 */
export function DashboardHeader() {
    const router = useRouter();
    const {
        handleSignOut,
        isAuthenticated,
        isGuest,
        isAdmin,
        authUser,
        t,
    } = useApp();

    // Get display name
    const displayName = isAuthenticated
        ? (authUser?.name || authUser?.email?.split("@")[0] || "User")
        : t("common.guestMode");

    return (
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
                <p className="text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {isGuest ? t("common.guestMode") : displayName}
                </p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
                <LanguageSelectorDropdown />
                <ThemeToggle className="mr-2 hidden sm:flex" />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/faq")}
                    className="gap-2"
                >
                    <HelpCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("common.faq")}</span>
                </Button>
                {isAdmin && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/admin")}
                        className="gap-2"
                    >
                        <Shield className="w-4 h-4" />
                        {t("common.admin")}
                    </Button>
                )}
                {isGuest ? (
                    <Button
                        variant="outline"
                        onClick={() => router.push("/login")}
                        className="gap-2"
                    >
                        <LogIn className="w-4 h-4" />
                        {t("common.signIn")}
                    </Button>
                ) : (
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/settings")}
                            className="gap-2"
                        >
                            <Settings className="w-4 h-4" />
                            {t("common.settings")}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleSignOut}
                            className="gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            {t("common.signOut")}
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
