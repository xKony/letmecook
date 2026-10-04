"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
    Bell,
    BellOff,
    Check,
    Copy,
    ExternalLink,
    Loader2,
    RefreshCw,
    Send,
    Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/app-context";
import { useI18n } from "@/lib/i18n-context";
import { useNtfyReminders } from "@/hooks/use-ntfy-reminders";
import { getDeckStudyStats } from "@/lib/spaced-repetition";
import {
    buildDueReminder,
    getAppUrl,
    getDeepLink,
    getSubscribeUrl,
    publishToTopic,
} from "@/lib/ntfy";
import { sendDueReminderNow, setRemindersEnabled } from "@/app/actions/reminder-actions";

/**
 * ntfy.sh pairing + reminder preferences.
 *
 * Works in both modes:
 * - Authenticated: topic + enabled flag live in the DB (server actions),
 *   daily reminders are sent by the `/api/cron/reminders` sweep.
 * - Guest: topic + flag live in localStorage; test/manual sends publish
 *   straight from the browser. Automatic daily sends need an account.
 *
 * Pairing: the QR code encodes `https://ntfy.sh/<topic>`. Scanning it with
 * an iPhone either opens the ntfy iOS app on that topic (universal link)
 * or the ntfy web client with the topic prefilled — then tap Subscribe.
 */
export function NtfySetup() {
    const { isAuthenticated, decks } = useApp();
    const { t } = useI18n();
    const router = useRouter();
    const guest = useNtfyReminders();

    const [authTopic, setAuthTopic] = useState<string | null>(null);
    const [authEnabled, setAuthEnabled] = useState(false);
    const [authLoaded, setAuthLoaded] = useState(!isAuthenticated);
    const [busy, setBusy] = useState<"toggle" | "test" | "now" | "regen" | null>(null);
    const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
    const [copied, setCopied] = useState(false);

    // Load server-side settings for authenticated users. Guests use local
    // state only; their readiness is derived from the guest hook below.
    useEffect(() => {
        if (!isAuthenticated) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/reminders/test", { cache: "no-store" });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = (await res.json()) as { topic: string; enabled: boolean };
                if (!cancelled) {
                    setAuthTopic(data.topic);
                    setAuthEnabled(data.enabled);
                }
            } catch {
                if (!cancelled) {
                    setNotice({ kind: "err", text: t("reminders.loadError") });
                }
            } finally {
                if (!cancelled) setAuthLoaded(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, t]);

    const topic = isAuthenticated ? authTopic : guest.topic;
    const enabled = isAuthenticated ? authEnabled : guest.enabled;
    const loaded = isAuthenticated ? authLoaded : guest.loaded;

    const stats = useMemo(() => {
        const all = decks.flatMap((d) => d.cards);
        return getDeckStudyStats(all);
    }, [decks]);

    const subscribeUrl = topic ? getSubscribeUrl(topic) : "";

    const flash = useCallback((kind: "ok" | "err", text: string) => {
        setNotice({ kind, text });
    }, []);

    const handleToggle = useCallback(async () => {
        if (!topic) return;
        setBusy("toggle");
        setNotice(null);
        try {
            if (isAuthenticated) {
                const next = await setRemindersEnabled(!enabled);
                setAuthEnabled(next.enabled);
            } else {
                guest.setEnabled(!enabled);
            }
        } catch (error) {
            flash("err", error instanceof Error ? error.message : t("reminders.toggleError"));
        } finally {
            setBusy(null);
        }
    }, [topic, enabled, isAuthenticated, guest, flash, t]);

    const handleTest = useCallback(async () => {
        if (!topic) return;
        setBusy("test");
        setNotice(null);
        try {
            if (isAuthenticated) {
                const res = await fetch("/api/reminders/test", { method: "POST" });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
            } else {
                await publishToTopic(topic, {
                    title: "LetMeCook test 🔔",
                    message: "Pairing works! You'll get a reminder here when reviews are due.",
                    tags: ["tada"],
                    priority: "default",
                });
            }
            flash("ok", t("reminders.testSent"));
        } catch (error) {
            flash("err", error instanceof Error ? error.message : t("reminders.testError"));
        } finally {
            setBusy(null);
        }
    }, [topic, isAuthenticated, flash, t]);

    const handleRemindNow = useCallback(async () => {
        if (!topic || stats.due === 0) return;
        setBusy("now");
        setNotice(null);
        try {
            const appUrl =
                typeof window !== "undefined" ? window.location.origin : getAppUrl() || undefined;
            if (isAuthenticated) {
                await sendDueReminderNow(stats.due);
            } else {
                await publishToTopic(
                    topic,
                    buildDueReminder(stats.due, undefined, appUrl),
                );
            }
            flash("ok", t("reminders.reminderSent"));
        } catch (error) {
            flash("err", error instanceof Error ? error.message : t("reminders.testError"));
        } finally {
            setBusy(null);
        }
    }, [topic, stats.due, isAuthenticated, flash, t]);

    const handleRegenerate = useCallback(async () => {
        setBusy("regen");
        setNotice(null);
        try {
            if (isAuthenticated) {
                const res = await fetch("/api/reminders/test", { cache: "no-store" });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                // Rotation goes through the server action to keep DB + flag in sync.
                const { regenerateReminderTopic } = await import(
                    "@/app/actions/reminder-actions"
                );
                const next = await regenerateReminderTopic();
                setAuthTopic(next.topic);
                setAuthEnabled(next.enabled);
            } else {
                guest.regenerate();
            }
            flash("ok", t("reminders.regenerated"));
        } catch (error) {
            flash("err", error instanceof Error ? error.message : t("reminders.regenError"));
        } finally {
            setBusy(null);
        }
    }, [isAuthenticated, guest, flash, t]);

    const handleCopy = useCallback(async () => {
        if (!topic) return;
        try {
            await navigator.clipboard.writeText(topic);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            flash("err", t("reminders.copyError"));
        }
    }, [topic, flash, t]);

    if (!loaded) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        {enabled ? (
                            <Bell className="w-5 h-5 text-primary" />
                        ) : (
                            <BellOff className="w-5 h-5 text-muted-foreground" />
                        )}
                        {t("reminders.title")}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t("reminders.description")}
                    </p>
                </div>
                <Button
                    variant={enabled ? "default" : "outline"}
                    onClick={handleToggle}
                    disabled={busy === "toggle" || !topic}
                    className="rounded-xl shrink-0"
                >
                    {busy === "toggle" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : enabled ? (
                        t("reminders.enabled")
                    ) : (
                        t("reminders.enable")
                    )}
                </Button>
            </div>

            {/* Due summary */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold">{stats.due}</div>
                    <div className="text-xs text-muted-foreground">{t("reminders.dueNow")}</div>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <div className="text-xs text-muted-foreground">{t("reminders.totalCards")}</div>
                </div>
            </div>

            {notice && (
                <div
                    className={`text-sm p-3 rounded-lg border flex items-center gap-2 ${
                        notice.kind === "ok"
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                    }`}
                >
                    {notice.kind === "ok" ? (
                        <Check className="w-4 h-4 shrink-0" />
                    ) : null}
                    {notice.text}
                </div>
            )}

            {topic && (
                <>
                    {/* QR pairing */}
                    <div className="flex flex-col sm:flex-row gap-6 items-center">
                        <div className="bg-white rounded-2xl p-4 shrink-0">
                            <QRCodeSVG value={subscribeUrl} size={180} level="M" />
                        </div>
                        <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                            <li>{t("reminders.step1")}</li>
                            <li>{t("reminders.step2")}</li>
                            <li>{t("reminders.step3")}</li>
                            <li>{t("reminders.step4")}</li>
                        </ol>
                    </div>

                    {/* Topic + actions */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <code className="flex-1 truncate px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm font-mono">
                                {topic}
                            </code>
                            <Button variant="outline" size="icon" onClick={handleCopy} title={t("reminders.copyTopic")}>
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={handleTest} disabled={busy === "test"} className="rounded-xl">
                                {busy === "test" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {t("reminders.sendTest")}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRemindNow}
                                disabled={busy === "now" || stats.due === 0}
                                className="rounded-xl"
                            >
                                {busy === "now" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                                {t("reminders.remindNow")}
                            </Button>
                            <Button variant="ghost" size="sm" asChild className="rounded-xl">
                                <a href={subscribeUrl} target="_blank" rel="noreferrer">
                                    <ExternalLink className="w-4 h-4" />
                                    {t("reminders.openWebApp")}
                                </a>
                            </Button>
                            <Button variant="ghost" size="sm" asChild className="rounded-xl">
                                <a href={getDeepLink(topic)}>
                                    <Smartphone className="w-4 h-4" />
                                    {t("reminders.openInApp")}
                                </a>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRegenerate}
                                disabled={busy === "regen"}
                                className="rounded-xl text-muted-foreground"
                            >
                                {busy === "regen" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                {t("reminders.regenerate")}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">{t("reminders.privacyNote")}</p>
                    </div>
                </>
            )}

            {!isAuthenticated && (
                <div className="text-sm p-4 bg-primary/5 border border-primary/20 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3">
                    <p className="flex-1 text-muted-foreground">{t("reminders.guestNote")}</p>
                    <Button size="sm" onClick={() => router.push("/login")} className="rounded-xl shrink-0">
                        {t("common.signIn")}
                    </Button>
                </div>
            )}
        </div>
    );
}
