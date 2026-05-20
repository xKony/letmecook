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
    ArrowLeft,
    Users,
    Trash2
} from "lucide-react";
import { createPublicDeck, getPublicDecks, toggleDeckPublic, checkIsAdmin, getAllUsers, updateUserMaxDecks, deletePublicDeck } from "@/app/actions/admin-actions";
import { parseQuestionsFile } from "@/lib/storage";
import { useApp } from "@/lib/app-context";

interface PublicDeck {
    id: string;
    name: string;
    isPublic: boolean;
    flashcards: { id: string }[];
}

interface AdminUser {
    id: string;
    email: string;
    name: string | null;
    isAdmin: boolean;
    maxDecks: number;
    deckCount: number;
    createdAt: Date;
}

export default function AdminPage() {
    const router = useRouter();
    const { t } = useApp();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [decks, setDecks] = useState<PublicDeck[]>([]);
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deckName, setDeckName] = useState("");
    const [fileContent, setFileContent] = useState("");
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [pendingMaxDecks, setPendingMaxDecks] = useState<Record<string, number>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function checkAdmin() {
            const adminStatus = await checkIsAdmin();
            setIsAdmin(adminStatus);
            if (adminStatus) {
                const publicDecks = await getPublicDecks();
                setDecks(publicDecks as PublicDeck[]);
                const users = await getAllUsers();
                setAdminUsers(users as AdminUser[]);
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
            setMessage({ type: "error", text: t("admin.noPublicDecks") }); // Reuse or add specific key
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

    const handleDeleteDeck = async (deckId: string, name: string) => {
        if (!confirm(t("dashboard.deleteDeckDescription", { name }))) {
            return;
        }

        try {
            await deletePublicDeck(deckId);
            setMessage({ type: "success", text: `Deleted "${name}"` });
            const publicDecks = await getPublicDecks();
            setDecks(publicDecks as PublicDeck[]);
        } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to delete deck" });
        }
    };

    const handleMaxDecksChange = async (userId: string, newMax: number) => {
        try {
            await updateUserMaxDecks(userId, newMax);
            const users = await getAllUsers();
            setAdminUsers(users as AdminUser[]);
        } catch (err) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update" });
        }
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
                <h1 className="text-2xl font-bold">{t("admin.accessDenied")}</h1>
                <p className="text-muted-foreground">{t("admin.noAdminPrivileges")}</p>
                <Button onClick={() => router.push("/")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t("admin.goHome")}
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
                        <h1 className="text-3xl font-bold">{t("admin.dashboard")}</h1>
                        <p className="text-muted-foreground">{t("admin.managePublicDecks")}</p>
                    </div>
                    <Button variant="outline" onClick={() => router.push("/")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {t("admin.back")}
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
                        {t("admin.uploadPublicDeck")}
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">{t("admin.deckName")}</label>
                            <input
                                type="text"
                                value={deckName}
                                onChange={(e) => setDeckName(e.target.value)}
                                placeholder={t("admin.deckNamePlaceholder")}
                                className="w-full mt-1 px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">{t("admin.questionsFile")}</label>
                            <p className="text-xs text-muted-foreground mb-2">
                                {t("admin.fileFormatHint")}
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
                                {fileContent ? t("admin.fileSelected") : t("dashboard.chooseFile")}
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
                                    {t("admin.uploading")}
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    {t("admin.uploadPublicDeck")}
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
                        {t("admin.publicDecksCount", { count: decks.length })}
                    </h2>

                    {decks.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            {t("admin.noPublicDecks")}
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
                                            {t("dashboard.cardsCount", { count: deck.flashcards.length })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleTogglePublic(deck.id)}
                                        >
                                            {deck.isPublic ? (
                                                <>
                                                    <Globe className="w-4 h-4 mr-1 text-emerald-500" />
                                                    {t("admin.public")}
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="w-4 h-4 mr-1" />
                                                    {t("admin.private")}
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteDeck(deck.id, deck.name)}
                                            className="text-rose-400 hover:text-rose-500 hover:bg-rose-500/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Manage Users */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card border border-border rounded-xl p-6 space-y-4"
                >
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        {t("admin.manageUsers", { count: adminUsers.length })}
                    </h2>

                    {adminUsers.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            {t("admin.noUsersFound")}
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {adminUsers.map((user) => {
                                const pendingValue = pendingMaxDecks[user.id];
                                const currentValue = pendingValue !== undefined ? pendingValue : user.maxDecks;
                                const hasChanged = pendingValue !== undefined && pendingValue !== user.maxDecks;
                                return (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{user.email}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {t("dashboard.cardsCount", { count: user.deckCount })} / {user.maxDecks}
                                                {user.isAdmin && <span className="ml-2 text-emerald-500">• Admin</span>}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <span className="text-sm text-muted-foreground">{t("admin.maxDecks")}:</span>
                                            <input
                                                type="number"
                                                min={1}
                                                max={100}
                                                value={currentValue}
                                                onChange={(e) => setPendingMaxDecks((prev) => ({ ...prev, [user.id]: parseInt(e.target.value, 10) || 1 }))}
                                                className="w-16 px-2 py-1 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                            {hasChanged && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        handleMaxDecksChange(user.id, currentValue);
                                                        setPendingMaxDecks((prev) => {
                                                            const next = { ...prev };
                                                            delete next[user.id];
                                                            return next;
                                                        });
                                                    }}
                                                >
                                                    <Check className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
