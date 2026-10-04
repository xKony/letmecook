import { RemindersClient } from "./reminders-client";

export const metadata = {
    title: "Review Reminders — LetMeCook",
    description: "Pair your phone with ntfy.sh to get spaced-repetition review reminders.",
};

export default function RemindersPage() {
    return <RemindersClient />;
}
