"use client";

import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/app-context";

interface ImportDropZoneProps {
    isImporting: boolean;
    setIsImporting: (value: boolean) => void;
    deckName: string;
    setDeckName: (value: string) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDrop: (e: React.DragEvent) => void;
    handleDragOver: (e: React.DragEvent) => void;
}

/**
 * Drop zone and form for importing new decks from .txt files.
 */
export function ImportDropZone({
    isImporting,
    setIsImporting,
    deckName,
    setDeckName,
    fileInputRef,
    handleFileSelect,
    handleDrop,
    handleDragOver,
}: ImportDropZoneProps) {
    const { t } = useApp();

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
        }
    };

    return (
        <>
            {/* Drop Zone */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-border rounded-2xl p-8 text-center mb-8 hover:border-primary/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="button"
                aria-label={t("dashboard.dropZoneTitle")}
            >
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">{t("dashboard.dropZoneTitle")}</p>
                <p className="text-sm text-muted-foreground mt-1">
                    {t("dashboard.dropZoneDescription")}
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </motion.div>

            {/* Import Form */}
            {isImporting && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-card rounded-xl p-4 mb-8 border border-border"
                >
                    <input
                        type="text"
                        value={deckName}
                        onChange={(e) => setDeckName(e.target.value)}
                        placeholder={t("dashboard.deckNamePlaceholder")}
                        className="w-full p-3 rounded-lg bg-background border border-input mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex gap-2">
                        <Button onClick={() => fileInputRef.current?.click()}>
                            {t("dashboard.chooseFile")}
                        </Button>
                        <Button variant="ghost" onClick={() => setIsImporting(false)}>
                            {t("common.cancel")}
                        </Button>
                    </div>
                </motion.div>
            )}
        </>
    );
}
