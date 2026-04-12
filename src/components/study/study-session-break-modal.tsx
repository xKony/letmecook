"use client";

import React from "react";
import { Coffee } from "lucide-react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface StudySessionBreakModalProps {
    isOpen: boolean;
    onClose: () => void;
    formattedTime: string;
    onTakeBreak: () => void;
    t: (key: string, options?: Record<string, string | number>) => string;
}

/**
 * Modal reminding the user to take a break after a certain session duration.
 * 
 * @param isOpen Whether the modal is open.
 * @param onClose Callback to close the modal and continue studying.
 * @param formattedTime The total session duration formatted for display.
 * @param onTakeBreak Callback to stop the session and take a break.
 * @param t Translation function.
 */
export function StudySessionBreakModal({
    isOpen,
    onClose,
    formattedTime,
    onTakeBreak,
    t,
}: StudySessionBreakModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-sm text-center">
                <DialogHeader className="items-center">
                    <div className="w-16 h-16 mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Coffee className="w-8 h-8 text-amber-500" aria-hidden="true" />
                    </div>
                    <DialogTitle className="text-xl font-semibold">{t("study.breakTime")}</DialogTitle>
                    <DialogDescription className="text-muted-foreground mt-2">
                        {t("study.breakDescription", { time: formattedTime })}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 mt-6">
                    <Button onClick={onClose} className="w-full">
                        {t("study.continueStudying")}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onTakeBreak}
                        className="w-full"
                    >
                        {t("study.takeBreak")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
