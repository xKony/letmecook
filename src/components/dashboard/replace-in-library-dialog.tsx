"use client";

import { useEffect, useState } from "react";
import { Loader2, Globe } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Deck } from "@/lib/types";
import { useI18n } from "@/lib/i18n-context";
import { getPublicDecks, replacePublicDeckFromPersonalDeck } from "@/app/actions/admin-actions";

interface PublicDeckOption {
    id: string;
    name: string;
    flashcards: { id: string }[];
}

interface ReplaceInLibraryDialogProps {
    sourceDeck: Deck | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (message: string) => void;
}

export function ReplaceInLibraryDialog({
    sourceDeck,
    isOpen,
    onClose,
    onSuccess,
}: ReplaceInLibraryDialogProps) {
    const { t } = useI18n();
    const [publicDecks, setPublicDecks] = useState<PublicDeckOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [replacingId, setReplacingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        setError(null);
        setLoading(true);
        getPublicDecks()
            .then((decks) => setPublicDecks(decks as PublicDeckOption[]))
            .catch((err) => {
                setError(err instanceof Error ? err.message : "Failed to load library");
            })
            .finally(() => setLoading(false));
    }, [isOpen]);

    const handleReplace = async (publicDeck: PublicDeckOption) => {
        if (!sourceDeck) return;

        const confirmed = confirm(
            t("dashboard.replaceInLibraryConfirm", {
                source: sourceDeck.name,
                target: publicDeck.name,
                count: sourceDeck.cards.length,
            })
        );
        if (!confirmed) return;

        setReplacingId(publicDeck.id);
        setError(null);

        try {
            const result = await replacePublicDeckFromPersonalDeck(publicDeck.id, sourceDeck.id);
            const successMessage = t("dashboard.replaceInLibrarySuccess", {
                source: result.sourceDeckName,
                target: result.publicDeckName,
                count: result.cardCount,
            });
            onSuccess?.(successMessage);
            onClose();
            alert(successMessage);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to replace deck");
        } finally {
            setReplacingId(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        {t("dashboard.replaceInLibrary")}
                    </DialogTitle>
                    {sourceDeck && (
                        <DialogDescription>
                            {t("dashboard.replaceInLibraryDescription", {
                                name: sourceDeck.name,
                                count: sourceDeck.cards.length,
                            })}
                        </DialogDescription>
                    )}
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : publicDecks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                        {t("dashboard.noPublicDecks")}
                    </p>
                ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {publicDecks.map((publicDeck) => (
                            <Button
                                key={publicDeck.id}
                                variant="outline"
                                className="w-full justify-between h-auto py-3"
                                disabled={replacingId !== null}
                                onClick={() => handleReplace(publicDeck)}
                            >
                                <span className="font-medium truncate">{publicDeck.name}</span>
                                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                    {replacingId === publicDeck.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        t("dashboard.cardsCount", { count: publicDeck.flashcards.length })
                                    )}
                                </span>
                            </Button>
                        ))}
                    </div>
                )}

                {error && (
                    <p className="text-sm text-rose-500 text-center">{error}</p>
                )}
            </DialogContent>
        </Dialog>
    );
}
