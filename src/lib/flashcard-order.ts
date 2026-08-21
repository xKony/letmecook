import { Flashcard } from "@/lib/types";

type OrderedCard = {
    sortOrder?: number;
    id: string;
    createdAt?: number | Date;
};

export function assignSortOrder<T extends { sortOrder?: number }>(
    cards: T[]
): (T & { sortOrder: number })[] {
    return cards.map((card, index) => ({
        ...card,
        sortOrder: card.sortOrder ?? index,
    }));
}

export function sortFlashcardsByOrder<T extends OrderedCard>(cards: T[]): T[] {
    return [...cards].sort((a, b) => {
        const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        if (orderDiff !== 0) return orderDiff;

        if (a.createdAt && b.createdAt) {
            const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt;
            const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt;
            const timeDiff = aTime - bTime;
            if (timeDiff !== 0) return timeDiff;
        }

        return a.id.localeCompare(b.id);
    });
}

export function backfillLegacySortOrder<T extends OrderedCard>(cards: T[]): (T & { sortOrder: number })[] {
    if (cards.length <= 1) {
        return assignSortOrder(cards);
    }

    const allUnset = cards.every((card) => card.sortOrder === undefined || card.sortOrder === 0);
    if (!allUnset) {
        return assignSortOrder(cards);
    }

    return sortFlashcardsByOrder(cards).map((card, index) => ({
        ...card,
        sortOrder: index,
    }));
}

export function normalizeDeckCards(cards: Flashcard[]): Flashcard[] {
    return sortFlashcardsByOrder(backfillLegacySortOrder(cards));
}

export function getQuestionNumber(card: Pick<Flashcard, "sortOrder">): number {
    return card.sortOrder + 1;
}
