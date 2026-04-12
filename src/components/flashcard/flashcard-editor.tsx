"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/app-context";

/**
 * Props for the FlashcardEditor component.
 */
interface FlashcardEditorProps {
    /** The current value of the text being edited. */
    value: string;
    /** Callback when the text changes. */
    onChange: (value: string) => void;
    /** Callback to save the changes. */
    onSave: () => void;
    /** Callback to cancel editing. */
    onCancel: () => void;
    /** Callback for keyboard events (e.g., Enter to save, Escape to cancel). */
    onKeyDown: (e: React.KeyboardEvent) => void;
    /** Placeholder text for the textarea. */
    placeholder: string;
    /** Whether this is the question editor (affects font size). */
    isQuestion?: boolean;
}

/**
 * Renders the editing interface for a flashcard's question or answer.
 * Includes a textarea for input and save/cancel buttons.
 * 
 * @param props - Component props.
 * @returns The rendered editor component.
 */
export function FlashcardEditor({
    value,
    onChange,
    onSave,
    onCancel,
    onKeyDown,
    placeholder,
    isQuestion = false,
}: FlashcardEditorProps) {
    const { t } = useApp();

    return (
        <motion.div
            key={isQuestion ? "edit-question" : "edit-answer"}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full flex flex-col gap-3"
        >
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                autoFocus
                className={`w-full p-4 font-bold text-center bg-background border border-input rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    isQuestion 
                        ? "text-xl md:text-2xl min-h-[100px]" 
                        : "text-lg md:text-xl font-medium min-h-[80px]"
                }`}
                placeholder={placeholder}
            />
            <div className="flex justify-center gap-2">
                <Button
                    size="sm"
                    onClick={onSave}
                    className="gap-1"
                >
                    <Check className="w-4 h-4" />
                    {t("common.save")}
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onCancel}
                    className="gap-1"
                >
                    <X className="w-4 h-4" />
                    {t("common.cancel")}
                </Button>
            </div>
        </motion.div>
    );
}
