"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { Language, getTranslation } from "@/lib/i18n";

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({
    children,
    initialLanguage = "en",
}: {
    children: React.ReactNode;
    initialLanguage?: Language;
}) {
    const [language, setLanguageState] = useState<Language>(initialLanguage);

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("language", lang);
        document.cookie = `lang=${lang}; max-age=31536000; path=/; samesite=lax`;
    }, []);

    const t = useCallback((key: string, params?: Record<string, string | number>) => {
        return getTranslation(language, key, params);
    }, [language]);

    const value = useMemo(
        () => ({ language, setLanguage, t }),
        [language, setLanguage, t]
    );

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error("useI18n must be used within I18nProvider");
    }
    return context;
}
