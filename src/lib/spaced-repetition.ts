import { createEmptyCard, fsrs, Rating, type Card, type Grade } from "ts-fsrs";
import type { CardLevel, Flashcard } from "@/lib/types";

/**
 * Spaced repetition engine — thin adapter over `ts-fsrs`
 * (the official TypeScript port of FSRS, by open-spaced-repetition).
 *
 * The app historically stored only a coarse `level` per card
 * ("Nowe" / "Nie umiem" / "W miarę" / "Umiem" / "Opanowane 100%").
 * FSRS memory state is layered on top via flat optional fields on
 * `Flashcard` (also mirrored as DB columns + guest localStorage):
 *
 * - `fsrsDue` (ms epoch) — when the card becomes due again
 * - `fsrsStability` / `fsrsDifficulty` — FSRS memory parameters
 * - `fsrsReps` / `fsrsLapses` — successful recalls / Again count
 * - `fsrsState` — ts-fsrs State (0 New, 1 Learning, 2 Review, 3 Relearning)
 * - `fsrsLastReview` (ms epoch | null)
 * - `fsrsScheduledDays` — last scheduled interval, for display
 *
 * Cards without FSRS data (legacy rows, fresh imports) are treated as
 * new cards. The legacy `level` label is still updated on every review
 * so existing filters/stats UI keeps working.
 */

let scheduler: ReturnType<typeof fsrs> | null = null;

/** Shared FSRS scheduler with default parameters (request retention 0.9). */
export function getScheduler() {
    if (!scheduler) scheduler = fsrs();
    return scheduler;
}

/** Map the app's rating buttons to FSRS grades. */
export function levelToGrade(level: CardLevel): Grade {
    switch (level) {
        case "Nie umiem":
            return Rating.Again;
        case "W miarę":
            return Rating.Hard;
        case "Umiem":
            return Rating.Good;
        case "Opanowane 100%":
            return Rating.Easy;
        case "Nowe":
        default:
            // "Nowe" is never a rating — fall back to Good for safety.
            return Rating.Good;
    }
}

export type FsrsSnapshot = Pick<
    Flashcard,
    | "fsrsDue"
    | "fsrsStability"
    | "fsrsDifficulty"
    | "fsrsReps"
    | "fsrsLapses"
    | "fsrsState"
    | "fsrsLearningSteps"
    | "fsrsLastReview"
    | "fsrsScheduledDays"
>;

export interface FsrsMemoryUpdate {
    fsrsDue: number;
    fsrsStability: number;
    fsrsDifficulty: number;
    fsrsReps: number;
    fsrsLapses: number;
    fsrsState: number;
    fsrsLearningSteps: number;
    fsrsLastReview: number;
    fsrsScheduledDays: number;
}

/** Convert our stored snapshot to a ts-fsrs Card. Missing data = new card. */
export function toFsrsCard(snapshot: FsrsSnapshot, now: number = Date.now()): Card {
    if (snapshot.fsrsStability == null || snapshot.fsrsDifficulty == null) {
        const empty = createEmptyCard();
        empty.due = new Date(snapshot.fsrsDue ?? now);
        return empty;
    }
    return {
        due: new Date(snapshot.fsrsDue ?? now),
        stability: snapshot.fsrsStability,
        difficulty: snapshot.fsrsDifficulty,
        elapsed_days: 0,
        scheduled_days: snapshot.fsrsScheduledDays ?? 0,
        reps: snapshot.fsrsReps ?? 0,
        lapses: snapshot.fsrsLapses ?? 0,
        learning_steps: snapshot.fsrsLearningSteps ?? 0,
        state: (snapshot.fsrsState ?? 0) as Card["state"],
        last_review:
            snapshot.fsrsLastReview != null ? new Date(snapshot.fsrsLastReview) : undefined,
    };
}

/** Convert a ts-fsrs Card back to our flat storage fields. */
export function fromFsrsCard(card: Card): FsrsMemoryUpdate {
    return {
        fsrsDue: card.due.getTime(),
        fsrsStability: card.stability,
        fsrsDifficulty: card.difficulty,
        fsrsReps: card.reps,
        fsrsLapses: card.lapses,
        fsrsState: card.state,
        fsrsLearningSteps: card.learning_steps,
        fsrsLastReview: card.last_review ? card.last_review.getTime() : Date.now(),
        fsrsScheduledDays: card.scheduled_days,
    };
}

/**
 * Apply an FSRS review. Pure (apart from interval fuzz) — safe to use on
 * client (guest) and server (auth).
 */
export function reviewCard(
    snapshot: FsrsSnapshot,
    level: CardLevel,
    now: number = Date.now(),
): FsrsMemoryUpdate {
    const scheduler = getScheduler();
    const card = toFsrsCard(snapshot, now);
    const result = scheduler.next(card, new Date(now), levelToGrade(level));
    return fromFsrsCard(result.card);
}

/** A card with no scheduling state (or a past due) is due now. */
export function isDue(snapshot: Pick<FsrsSnapshot, "fsrsDue">, now: number = Date.now()): boolean {
    if (snapshot.fsrsDue == null) return true;
    return snapshot.fsrsDue <= now;
}

export function getDueCards<T extends Pick<FsrsSnapshot, "fsrsDue">>(
    cards: T[],
    now: number = Date.now(),
): T[] {
    return cards.filter((c) => isDue(c, now));
}

/** Earliest future due among cards, or null when everything is due / empty. */
export function getNextDueAt<T extends Pick<FsrsSnapshot, "fsrsDue">>(
    cards: T[],
    now: number = Date.now(),
): number | null {
    let next: number | null = null;
    for (const card of cards) {
        if (card.fsrsDue == null) return now; // new card -> due immediately
        if (card.fsrsDue > now && (next == null || card.fsrsDue < next)) {
            next = card.fsrsDue;
        }
    }
    return next;
}

export interface DeckStudyStats {
    total: number;
    due: number;
    fresh: number;
    nextDueAt: number | null;
}

/** Aggregate counts used by dashboard badges and reminder messages. */
export function getDeckStudyStats<T extends Pick<FsrsSnapshot, "fsrsDue">>(
    cards: T[],
    now: number = Date.now(),
): DeckStudyStats {
    const total = cards.length;
    const due = cards.filter((c) => isDue(c, now)).length;
    return {
        total,
        due,
        fresh: total - due,
        nextDueAt: getNextDueAt(cards, now),
    };
}

/** Sort due cards first (most overdue first), then by upcoming due. */
export function sortByDue<T extends Pick<FsrsSnapshot, "fsrsDue"> & { sortOrder: number }>(
    cards: T[],
    now: number = Date.now(),
): T[] {
    return [...cards].sort((a, b) => {
        const aDue = a.fsrsDue ?? 0;
        const bDue = b.fsrsDue ?? 0;
        const aIsDue = aDue <= now;
        const bIsDue = bDue <= now;
        if (aIsDue && !bIsDue) return -1;
        if (!aIsDue && bIsDue) return 1;
        if (aDue !== bDue) return aDue - bDue;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
}

/** Human-readable "due in" label, e.g. "10 min", "3 hours", "5 days". */
export function formatDueIn(dueAt: number, now: number = Date.now()): string {
    const diffMs = Math.max(0, dueAt - now);
    const minutes = Math.round(diffMs / 60000);
    if (minutes < 1) return "now";
    if (minutes < 60) return minutes === 1 ? "1 min" : `${minutes} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 48) return hours === 1 ? "1 hour" : `${hours} hours`;
    const days = Math.round(hours / 24);
    if (days < 45) return days === 1 ? "1 day" : `${days} days`;
    const months = Math.round(days / 30.44);
    if (months < 24) return months === 1 ? "1 month" : `${months} months`;
    const years = Math.round(months / 12);
    return years === 1 ? "1 year" : `${years} years`;
}

/** Preview the next due-in label for each rating — shown as a hint on rate buttons. */
export function previewIntervals(
    snapshot: FsrsSnapshot,
    now: number = Date.now(),
): Record<Exclude<CardLevel, "Nowe">, string> {
    const scheduler = getScheduler();
    const card = toFsrsCard(snapshot, now);
    const record = scheduler.repeat(card, new Date(now));
    const grades: { level: Exclude<CardLevel, "Nowe">; grade: Grade }[] = [
        { level: "Nie umiem", grade: Rating.Again },
        { level: "W miarę", grade: Rating.Hard },
        { level: "Umiem", grade: Rating.Good },
        { level: "Opanowane 100%", grade: Rating.Easy },
    ];
    const out = {} as Record<Exclude<CardLevel, "Nowe">, string>;
    for (const { level, grade } of grades) {
        out[level] = formatDueIn(record[grade].card.due.getTime(), now);
    }
    return out;
}
