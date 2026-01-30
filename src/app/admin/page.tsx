"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    Upload,
    FileText,
    Plus,
    Loader2,
    Check,
    AlertCircle,
    Globe,
    Lock,
    ArrowLeft
} from "lucide-react";
import { createPublicDeck, getPublicDecks, toggleDeckPublic, checkIsAdmin } from "@/app/actions/admin-actions";
import { parseQuestionsFile } from "@/lib/storage";

interface PublicDeck {
    id: string;
    name: string;
    isPublic: boolean;
    flashcards: { id: string }[];
}

export default function AdminPage() {
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [decks, setDecks] = useState<PublicDeck[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deckName, setDeckName] = useState("");
    const [fileContent, setFileContent] = useState("");
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function checkAdmin() {
            const adminStatus = await checkIsAdmin();
            setIsAdmin(adminStatus);
            if (adminStatus) {
                const publicDecks = await getPublicDecks();
                setDecks(publicDecks as PublicDeck[]);
            }
            setLoading(false);
        }
        checkAdmin();
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const content = await file.text();
        setFileContent(content);

        // Auto-set deck name from file name (without extension)
        if (!deckName) {
            setDeckName(file.name.replace(/\.[^/.]+$/, ""));
        }
    };

    const handleUpload = async () => {
        if (!deckName.trim() || !fileContent.trim()) {
            setMessage({ type: "error", text: "Please provide a deck name and file" });
            return;
        }

        setUploading(true);
        setMessage(null);

        try {
            const parsedCards = parseQuestionsFile(fileContent);
            if (parsedCards.length === 0) {
                throw new Error("No valid Q&A pairs found in file");
            }

            await createPublicDeck(deckName, parsedCards);
            setMessage({ type: "success", text: `Created "${deckName}" with ${parsedCards.length} cards` });

            // Refresh decks list
            const publicDecks = await getPublicDecks();
            setDecks(publicDecks as PublicDeck[]);

            // Reset form
            setDeckName("");
            setFileContent("");
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to upload" });
        } finally {
            setUploading(false);
        }
    };

    const handleTogglePublic = async (deckId: string) => {
        await toggleDeckPublic(deckId);
        const publicDecks = await getPublicDecks();
        setDecks(publicDecks as PublicDeck[]);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <AlertCircle className="w-16 h-16 text-rose-500" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You don't have admin privileges.</p>
                <Button onClick={() => router.push("/")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Home
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                        <p className="text-muted-foreground">Manage public decks</p>
                    </div>
                    <Button variant="outline" onClick={() => router.push("/")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </div>

                {/* Upload New Deck */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-xl p-6 space-y-4"
                >
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Upload Public Deck
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Deck Name</label>
                            <input
                                type="text"
                                value={deckName}
                                onChange={(e) => setDeckName(e.target.value)}
                                placeholder="e.g., Biology 101"
                                className="w-full mt-1 px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Questions File</label>
                            <p className="text-xs text-muted-foreground mb-2">
                                Format: Q: question A: answer (one per line)
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".txt,.md"
                                onChange={handleFileChange}
                                className="hidden"
                                id="deck-file"
                            />
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                {fileContent ? "File Selected ✓" : "Choose File"}
                            </Button>
                        </div>

                        <Button
                            onClick={handleUpload}
                            disabled={uploading || !deckName || !fileContent}
                            className="w-full"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Public Deck
                                </>
                            )}
                        </Button>

                        {message && (
                            <div className={`flex items-center gap-2 p-3 rounded-lg ${message.type === "success"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-rose-500/10 text-rose-400"
                                }`}>
                                {message.type === "success" ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <AlertCircle className="w-4 h-4" />
                                )}
                                {message.text}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Existing Public Decks */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border border-border rounded-xl p-6 space-y-4"
                >
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Public Decks ({decks.length})
                    </h2>

                    {decks.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No public decks yet. Upload one above!
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {decks.map((deck) => (
                                <div
                                    key={deck.id}
                                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium">{deck.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {deck.flashcards.length} cards
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleTogglePublic(deck.id)}
                                    >
                                        {deck.isPublic ? (
                                            <>
                                                <Globe className="w-4 h-4 mr-1 text-emerald-500" />
                                                Public
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="w-4 h-4 mr-1" />
                                                Private
                                            </>
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
