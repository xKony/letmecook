"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, HelpCircle, Shield, Settings, LogIn, LogOut, Menu, X } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useI18n } from "@/lib/i18n-context";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Component as LanguageSelectorDropdown } from "@/components/ui/language-selector-dropdown";

/**
 * Header component for the dashboard, containing user info, language/theme toggles, and navigation actions.
 */
export function DashboardHeader() {
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const {
        handleSignOut,
        isAuthenticated,
        isGuest,
        isAdmin,
        authUser,
    } = useApp();
    const { t } = useI18n();

    // Get display name
    const displayName = isAuthenticated
        ? (authUser?.name || authUser?.email?.split("@")[0] || "User")
        : t("common.guestMode");

    const navigateFromMobileMenu = (href: string) => {
        setIsMobileMenuOpen(false);
        router.push(href);
    };

    const signOutFromMobileMenu = () => {
        setIsMobileMenuOpen(false);
        handleSignOut();
    };

    return (
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
                <p className="text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {isGuest ? t("common.guestMode") : displayName}
                </p>
            </div>
            <div className="relative flex items-center gap-1 sm:gap-2">
                <div className="hidden sm:block">
                    <LanguageSelectorDropdown />
                </div>
                <ThemeToggle className="mr-2 hidden sm:flex" />
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setIsMobileMenuOpen((open) => !open)}
                    className="sm:hidden"
                    aria-expanded={isMobileMenuOpen}
                    aria-label={t("common.menu")}
                >
                    {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </Button>
                {isMobileMenuOpen && (
                    <div className="absolute right-0 top-11 z-50 w-64 rounded-2xl border border-border bg-background p-3 shadow-xl sm:hidden">
                        <div className="space-y-3 border-b border-border pb-3">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium text-muted-foreground">
                                    {t("common.language")}
                                </span>
                                <LanguageSelectorDropdown />
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium text-muted-foreground">
                                    {t("common.theme")}
                                </span>
                                <ThemeToggle />
                            </div>
                        </div>
                        <div className="mt-3 flex flex-col gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigateFromMobileMenu("/faq")}
                                className="justify-start gap-2"
                            >
                                <HelpCircle className="w-4 h-4" />
                                {t("common.faq")}
                            </Button>
                            {isAdmin && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigateFromMobileMenu("/admin")}
                                    className="justify-start gap-2"
                                >
                                    <Shield className="w-4 h-4" />
                                    {t("common.admin")}
                                </Button>
                            )}
                            {isGuest ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigateFromMobileMenu("/login")}
                                    className="justify-start gap-2"
                                >
                                    <LogIn className="w-4 h-4" />
                                    {t("common.signIn")}
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigateFromMobileMenu("/settings")}
                                        className="justify-start gap-2"
                                    >
                                        <Settings className="w-4 h-4" />
                                        {t("common.settings")}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={signOutFromMobileMenu}
                                        className="justify-start gap-2"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {t("common.signOut")}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/faq")}
                    className="hidden gap-2 sm:inline-flex"
                >
                    <HelpCircle className="w-4 h-4" />
                    <span>{t("common.faq")}</span>
                </Button>
                {isAdmin && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/admin")}
                        className="hidden gap-2 sm:inline-flex"
                    >
                        <Shield className="w-4 h-4" />
                        {t("common.admin")}
                    </Button>
                )}
                {isGuest ? (
                    <Button
                        variant="outline"
                        onClick={() => router.push("/login")}
                        className="hidden gap-2 sm:inline-flex"
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
                            className="hidden gap-2 sm:inline-flex"
                        >
                            <Settings className="w-4 h-4" />
                            {t("common.settings")}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleSignOut}
                            className="hidden gap-2 sm:inline-flex"
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
