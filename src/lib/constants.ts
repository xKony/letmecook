// Application-wide configuration constants
// Extracted from various components to centralize magic numbers

/**
 * Duration in milliseconds for long press detection on mobile devices
 * Used in flashcard.tsx for edit mode activation
 */
export const FLASHCARD_LONG_PRESS_MS = 1000;

/**
 * Duration in milliseconds for long press detection in dashboard
 * Used in dashboard.tsx for context menu activation
 */
export const DASHBOARD_LONG_PRESS_MS = 500;

/**
 * Maximum number of decks a user can create
 * Enforced in app-context.tsx
 */
export const MAX_DECKS_PER_USER = 5;

/**
 * Interval in seconds between break reminders during study sessions
 * 30 minutes = 1800 seconds
 */
export const BREAK_REMINDER_INTERVAL_SECONDS = 30 * 60;

/**
 * Debounce delay in milliseconds for localStorage saves
 * Used in app-context.tsx to reduce write frequency
 */
export const LOCALSTORAGE_SAVE_DEBOUNCE_MS = 500;
