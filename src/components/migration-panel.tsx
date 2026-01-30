"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileJson, Check, AlertCircle, Loader2 } from "lucide-react";
import { useExportDecks } from "@/hooks/use-export-decks";
import { importLocalStorageDecks } from "@/app/actions/migration-actions";

interface MigrationResult {
    success: boolean;
    imported: number;
    deckNames: string[];
}

export function MigrationPanel() {
    const { downloadExport } = useExportDecks();
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<MigrationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setError(null);
        setResult(null);

        try {
            const content = await file.text();
            const exportData = JSON.parse(content);

            // Validate export format
            if (!exportData.decks || !Array.isArray(exportData.decks)) {
                throw new Error("Invalid export file format");
            }

            const importResult = await importLocalStorageDecks(exportData);
            setResult(importResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to import decks");
        } finally {
            setImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 space-y-6"
        >
            <div>
                <h3 className="text-lg font-semibold mb-2">Data Migration</h3>
                <p className="text-sm text-muted-foreground">
                    Transfer your local decks to the cloud for sync across devices.
                </p>
            </div>

            {/* Export Section */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Step 1: Export Local Decks
                </h4>
                <p className="text-xs text-muted-foreground">
                    Download your current local decks as a JSON file.
                </p>
                <Button
                    variant="outline"
                    onClick={downloadExport}
                    className="w-full"
                >
                    <FileJson className="w-4 h-4 mr-2" />
                    Download Export
                </Button>
            </div>

            {/* Import Section */}
            <div className="space-y-3 pt-4 border-t border-border">
                <h4 className="text-sm font-medium flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Step 2: Import to Cloud
                </h4>
                <p className="text-xs text-muted-foreground">
                    Upload the export file to import your decks to your account.
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="import-file"
                />
                <Button
                    variant="default"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                    className="w-full"
                >
                    {importing ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Importing...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload & Import
                        </>
                    )}
                </Button>
            </div>

            {/* Result */}
            {result && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
                >
                    <Check className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-emerald-400">
                            Successfully imported {result.imported} deck(s)
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {result.deckNames.join(", ")}
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Error */}
            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg"
                >
                    <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5" />
                    <p className="text-sm text-rose-400">{error}</p>
                </motion.div>
            )}
        </motion.div>
    );
}
