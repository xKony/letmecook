import { Deck, EditableCard, Flashcard } from "@/lib/types";

export function deckToEditableCards(deck: Deck): EditableCard[] {
    return deck.cards.map((card) => ({
        id: card.id,
        question: card.question,
        answer: card.answer,
        image: card.image,
        level: card.level,
    }));
}

export function parsedToEditableCards(
    cards: Omit<Flashcard, "id" | "level">[]
): EditableCard[] {
    const base = Date.now();
    return cards.map((card, index) => ({
        id: `temp-${base}-${index}`,
        question: card.question,
        answer: card.answer,
        image: card.image,
    }));
}
