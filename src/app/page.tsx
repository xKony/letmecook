import { auth } from "@/lib/auth";
import { getMyDecks, getUserMaxDecks } from "@/app/actions/deck-actions";
import { AppMain } from "@/components/app-main";
import { transformDbDeck } from "@/lib/utils";
import { Deck } from "@/lib/types";

export default async function Home() {
    const session = await auth();

    // Fetch initial data on server if authenticated
    let initialDecks: Deck[] = [];
    let initialMaxDecks = 5;

    if (session?.user?.id) {
        try {
            // Fetch in parallel for speed
            const [decksData, maxDecks] = await Promise.all([
                getMyDecks(),
                getUserMaxDecks()
            ]);
            initialDecks = decksData.map(transformDbDeck);
            initialMaxDecks = maxDecks;
        } catch (error) {
            console.error("Failed to fetch initial server data:", error);
        }
    }

    return (
        <AppMain
            initialDecks={initialDecks}
            initialMaxDecks={initialMaxDecks}
        />
    );
}
