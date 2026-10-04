"use client";

import React, { useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface StudySessionGotoModalProps {
    isOpen: boolean;
    onClose: () => void;
    totalCards: number;
    onGoto: (index: number) => void;
    t: (key: string, options?: Record<string, string | number>) => string;
}

/**
 * Modal allowing the user to quickly navigate to a specific card index.
 * 
 * @param isOpen Whether the modal is open.
 * @param onClose Callback to close the modal.
 * @param totalCards Total number of cards in the current play order.
 * @param onGoto Callback triggered when a valid index is submitted.
 * @param t Translation function.
 */
export function StudySessionGotoModal({
    isOpen,
    onClose,
    totalCards,
    onGoto,
    t,
}: StudySessionGotoModalProps) {
    const [input, setInput] = useState("");

    const handleSubmit = () => {
        const targetNum = parseInt(input, 10);
        if (isNaN(targetNum) || targetNum < 1 || targetNum > totalCards) {
            return;
        }

        onGoto(targetNum - 1);
        setInput("");
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSubmit();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>{t("study.goToQuestion")}</DialogTitle>
                </DialogHeader>
                
                <div className="flex flex-col gap-4 mt-2">
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min={1}
                            max={totalCards}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`1 - ${totalCards}`}
                            autoFocus
                            className="flex-1 p-3 rounded-lg bg-background border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-[color,background-color,border-color,box-shadow]"
                            aria-label={t("study.goToQuestion")}
                        />
                        <Button onClick={handleSubmit}>{t("common.go")}</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {t("study.goToHint")}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
