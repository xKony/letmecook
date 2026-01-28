"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/app-context";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Trash2, BookOpen, LogOut, Pencil, Check, X } from "lucide-react";
import { GlobalDecksModal } from "@/components/global-decks-modal";

export function Dashboard() {
    const { currentUser, getUserDecks, addDeck, selectDeck, deleteDeck, renameDeck, logout } = useApp();
    const [isImporting, setIsImporting] = useState(false);
    const [deckName, setDeckName] = useState("");
    const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const decks = getUserDecks();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const name = deckName.trim() || file.name.replace(/\.txt$/, "");
            addDeck(name, content);
            setIsImporting(false);
            setDeckName("");
        };
        reader.readAsText(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file || !file.name.endsWith(".txt")) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const name = file.name.replace(/\.txt$/, "");
            addDeck(name, content);
        };
        reader.readAsText(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const startEditing = (deckId: string, currentName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingDeckId(deckId);
        setEditingName(currentName);
    };

    const saveRename = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (editingDeckId && editingName.trim()) {
            renameDeck(editingDeckId, editingName.trim());
        }
        setEditingDeckId(null);
        setEditingName("");
    };

    const cancelEditing = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setEditingDeckId(null);
        setEditingName("");
    };

    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            saveRename();
        } else if (e.key === "Escape") {
            cancelEditing();
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">LetMeCook 🍳</h1>
                        <p className="text-muted-foreground">Welcome, {currentUser?.name}</p>
                    </div>
                    <Button variant="ghost" onClick={logout} className="gap-2">
                        <LogOut className="w-4 h-4" />
                        Logout
                    </Button>
                </div>

                {/* Drop Zone */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-border rounded-2xl p-8 text-center mb-8 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">Drop a .txt file here</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        or click to browse (Format: Question | Answer)
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
                            placeholder="Deck name (optional)"
                            className="w-full p-3 rounded-lg bg-background border border-input mb-3"
                        />
                        <div className="flex gap-2">
                            <Button onClick={() => fileInputRef.current?.click()}>
                                Choose File
                            </Button>
                            <Button variant="ghost" onClick={() => setIsImporting(false)}>
                                Cancel
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* Deck List */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Your Decks ({decks.length}/5)</h2>
                        <div className="flex gap-2">
                            <GlobalDecksModal />
                            <Button onClick={() => setIsImporting(true)} className="gap-2">
                                <Plus className="w-4 h-4" />
                                New Deck
                            </Button>
                        </div>
                    </div>

                    {decks.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>No decks yet. Import a .txt file to get started!</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {decks.map((deck, index) => (
                                <motion.div
                                    key={deck.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group bg-card rounded-xl p-4 border border-border hover:border-primary/30 transition-all cursor-pointer"
                                    onClick={() => editingDeckId !== deck.id && selectDeck(deck.id)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <AnimatePresence mode="wait">
                                                {editingDeckId === deck.id ? (
                                                    <motion.div
                                                        key="editing"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="flex items-center gap-2"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <input
                                                            type="text"
                                                            value={editingName}
                                                            onChange={(e) => setEditingName(e.target.value)}
                                                            onKeyDown={handleRenameKeyDown}
                                                            autoFocus
                                                            className="flex-1 p-2 rounded-lg bg-background border border-input focus:border-primary focus:outline-none text-lg font-semibold"
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={saveRename}
                                                            className="text-emerald-500 hover:text-emerald-600"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={cancelEditing}
                                                            className="text-muted-foreground"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="display"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors truncate">
                                                                {deck.name}
                                                            </h3>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => startEditing(deck.id, deck.name, e)}
                                                                className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity h-6 w-6"
                                                            >
                                                                <Pencil className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {deck.cards.length} cards
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        {editingDeckId !== deck.id && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm("Delete this deck?")) {
                                                        deleteDeck(deck.id);
                                                    }
                                                }}
                                                className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                    {/* Progress bar */}
                                    <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all"
                                            style={{
                                                width: `${(deck.cards.filter((c) => c.level !== "Nowe").length /
                                                    deck.cards.length) *
                                                    100
                                                    }%`,
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
