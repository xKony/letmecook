import { CardLevel } from "./types";

// Shared level color mappings used across components
// Extracted to eliminate duplication between flashcard.tsx and study-session.tsx

export const LEVEL_COLORS: Record<CardLevel, { bg: string; text: string; bar: string; dot: string }> = {
    "Nowe": {
        bg: "bg-slate-500/20",
        text: "text-muted-foreground",
        bar: "bg-slate-400",
        dot: "bg-muted-foreground"
    },
    "Nie umiem": {
        bg: "bg-rose-500/20",
        text: "text-rose-500",
        bar: "bg-rose-500",
        dot: "bg-rose-500"
    },
    "W miarę": {
        bg: "bg-amber-500/20",
        text: "text-amber-500",
        bar: "bg-amber-500",
        dot: "bg-amber-500"
    },
    "Umiem": {
        bg: "bg-emerald-500/20",
        text: "text-emerald-500",
        bar: "bg-emerald-500",
        dot: "bg-emerald-500"
    },
    "Opanowane 100%": {
        bg: "bg-cyan-500/20",
        text: "text-cyan-500",
        bar: "bg-cyan-500",
        dot: "bg-cyan-500"
    },
};

// Rating button styles for flashcard component
export const RATING_STYLES: Record<CardLevel, string> = {
    "Nie umiem": "border-rose-500/20 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500",
    "W miarę": "border-amber-500/20 bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-500",
    "Umiem": "border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-500",
    "Opanowane 100%": "border-cyan-500/20 bg-cyan-500/10 hover:bg-cyan-500 hover:text-white text-cyan-500",
    "Nowe": "",
};

// All card levels in display order
export const ALL_LEVELS: CardLevel[] = ["Nowe", "Nie umiem", "W miarę", "Umiem", "Opanowane 100%"];
