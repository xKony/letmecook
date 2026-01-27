"use client";

import { useCallback, useState } from "react";

export function useTTS() {
    const [enabled, setEnabled] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const speak = useCallback((text: string) => {
        if (!enabled || typeof window === "undefined" || !window.speechSynthesis) {
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        if (!text.trim()) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "pl-PL"; // Polish as default, can be made configurable
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, [enabled]);

    const toggle = useCallback(() => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setEnabled((prev) => !prev);
    }, []);

    const stop = useCallback(() => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    }, []);

    return {
        enabled,
        isSpeaking,
        speak,
        toggle,
        stop,
    };
}
