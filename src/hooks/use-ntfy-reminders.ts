"use client";

import { useCallback, useEffect, useState } from "react";
import { generateTopic, isValidTopic } from "@/lib/ntfy";

const TOPIC_KEY = "letmecook_ntfy_topic";
const ENABLED_KEY = "letmecook_ntfy_enabled";

/**
 * Reminder pairing state for guest mode (localStorage).
 * Authenticated users use the server-side settings instead
 * (see `reminder-actions.ts`), but the topic format and QR flow are identical.
 */
export function useNtfyReminders() {
    const [topic, setTopic] = useState<string | null>(null);
    const [enabled, setEnabledState] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let stored = localStorage.getItem(TOPIC_KEY);
        if (!stored || !isValidTopic(stored)) {
            stored = generateTopic();
            try {
                localStorage.setItem(TOPIC_KEY, stored);
            } catch {
                // private mode — keep in memory only
            }
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Two-pass rendering is necessary to avoid hydration mismatch for localStorage-backed UI
        setTopic(stored);
        setEnabledState(localStorage.getItem(ENABLED_KEY) === "1");
        setLoaded(true);
    }, []);

    const setEnabled = useCallback((value: boolean) => {
        setEnabledState(value);
        try {
            localStorage.setItem(ENABLED_KEY, value ? "1" : "0");
        } catch {
            // ignore
        }
    }, []);

    const regenerate = useCallback(() => {
        const next = generateTopic();
        try {
            localStorage.setItem(TOPIC_KEY, next);
            localStorage.setItem(ENABLED_KEY, "0");
        } catch {
            // ignore
        }
        setTopic(next);
        setEnabledState(false);
        return next;
    }, []);

    return { topic, enabled, loaded, setEnabled, regenerate };
}
