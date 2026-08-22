"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmationModal({
    isOpen,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "default",
    onConfirm,
    onCancel,
}: ConfirmationModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    onClick={onCancel}
                >
                    <motion.div
                        className="bg-card border border-border rounded-2xl shadow-xl shadow-primary/10 w-full max-w-sm overflow-hidden"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12, ease: "easeOut" } }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 sm:p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-full ${variant === "destructive" ? "bg-red-500/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                            </div>

                            <p className="text-sm text-muted-foreground mb-6">
                                {description}
                            </p>

                            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                                <Button variant="ghost" className="h-11 sm:h-9" onClick={onCancel}>
                                    {cancelLabel}
                                </Button>
                                <Button
                                    variant={variant === "destructive" ? "destructive" : "default"}
                                    className="h-11 sm:h-9"
                                    onClick={onConfirm}
                                >
                                    {confirmLabel}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
