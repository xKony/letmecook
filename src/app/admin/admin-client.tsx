"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
    Trash2,
    FileDown,
    Sparkles
} from "lucide-react";
import { createPublicDeck, getPublicDecks, toggleDeckPublic, getAllUsers, updateUserMaxDecks, deletePublicDeck } from "@/app/actions/admin-actions";
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
    createdAt: string;
}

export function AdminClient() {
    const router = useRouter();
    const { t } = useApp();
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
        async function loadAdminData() {
            try {
                const publicDecks = await getPublicDecks();
                setDecks(publicDecks as PublicDeck[]);
                const users = await getAllUsers();
                setAdminUsers(users as AdminUser[]);
            } catch (err) {
                console.error("Failed to load admin data:", err);
            } finally {
                setLoading(false);
            }
        }
        loadAdminData();
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

    const [converterRawText, setConverterRawText] = useState("");
    const [converterDeckName, setConverterDeckName] = useState("");
    const [converterUploading, setConverterUploading] = useState(false);
    const [converterMessage, setConverterMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const converterFileInputRef = useRef<HTMLInputElement>(null);

    const parsedConverterCards = useMemo(() => {
        if (!converterRawText.trim()) return [];
        return parseQuestionsFile(converterRawText);
    }, [converterRawText]);

    const handleConverterFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const content = await file.text();
            setConverterRawText(content);
            
            // Auto-set deck name from file name
            if (!converterDeckName) {
                const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                setConverterDeckName(nameWithoutExt);
            }
            setConverterMessage(null);
        } catch {
            setConverterMessage({ type: "error", text: "Failed to read file" });
        } finally {
            if (converterFileInputRef.current) converterFileInputRef.current.value = "";
        }
    };

    const handleDownloadJson = () => {
        if (parsedConverterCards.length === 0) return;
        
        try {
            const jsonString = JSON.stringify(parsedConverterCards, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.href = url;
            link.download = `${converterDeckName.trim() || "converted_deck"}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            setConverterMessage({ 
                type: "success", 
                text: t("admin.conversionSuccess", { count: parsedConverterCards.length }) 
            });
        } catch {
            setConverterMessage({ type: "error", text: "Failed to download JSON" });
        }
    };

    const handleDirectUpload = async () => {
        if (!converterDeckName.trim() || parsedConverterCards.length === 0) {
            setConverterMessage({ type: "error", text: "Deck name and converted cards are required" });
            return;
        }
        
        setConverterUploading(true);
        setConverterMessage(null);
        
        try {
            await createPublicDeck(converterDeckName.trim(), parsedConverterCards);
            
            setConverterMessage({
                type: "success",
                text: `Successfully uploaded "${converterDeckName.trim()}" with ${parsedConverterCards.length} cards!`
            });
            
            // Refresh decks list
            const publicDecks = await getPublicDecks();
            setDecks(publicDecks as PublicDeck[]);
            
            // Clear fields
            setConverterDeckName("");
            setConverterRawText("");
        } catch (err) {
            setConverterMessage({ 
                type: "error", 
                text: err instanceof Error ? err.message : "Failed to upload deck" 
            });
        } finally {
            setConverterUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-6xl mx-auto space-y-8">
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

                <div className="grid md:grid-cols-2 gap-8 items-start">
                    {/* Left Column: Creator and Conversion Tools */}
                    <div className="space-y-8">
                        {/* Upload New Deck */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-border rounded-xl p-6 space-y-4"
                        >
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Plus className="w-5 h-5 text-indigo-400" />
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
                                        accept=".txt,.md,.json"
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
                                            <Check className="w-4 h-4 shrink-0" />
                                        ) : (
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                        )}
                                        <span className="break-all">{message.text}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Deck Format Converter */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-card border border-border rounded-xl p-6 space-y-4"
                        >
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-400" />
                                {t("admin.deckConverter")}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {t("admin.convertInstructions")}
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <input
                                        ref={converterFileInputRef}
                                        type="file"
                                        accept=".txt,.md"
                                        onChange={handleConverterFileChange}
                                        className="hidden"
                                        id="converter-file"
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => converterFileInputRef.current?.click()}
                                        className="w-full text-xs"
                                        size="sm"
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        {t("admin.convertFile")}
                                    </Button>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">{t("admin.pasteRawText")}</label>
                                    <textarea
                                        value={converterRawText}
                                        onChange={(e) => setConverterRawText(e.target.value)}
                                        placeholder={t("admin.rawTextPlaceholder")}
                                        rows={5}
                                        className="w-full text-sm p-3 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono resize-y"
                                    />
                                </div>

                                {parsedConverterCards.length > 0 && (
                                    <div className="space-y-3 p-3 bg-muted/20 border border-border/50 rounded-lg">
                                        <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                                            <Check className="w-4 h-4 shrink-0" />
                                            {t("admin.conversionSuccess", { count: parsedConverterCards.length })}
                                        </p>
                                        
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground">{t("admin.deckName")} (for download/upload)</label>
                                            <input
                                                type="text"
                                                value={converterDeckName}
                                                onChange={(e) => setConverterDeckName(e.target.value)}
                                                placeholder={t("admin.deckNamePlaceholder")}
                                                className="w-full text-sm px-3 py-1.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={handleDownloadJson}
                                                className="flex-1 text-xs"
                                                size="sm"
                                                disabled={!converterDeckName.trim()}
                                            >
                                                <FileDown className="w-4 h-4 mr-1.5" />
                                                {t("admin.downloadJson")}
                                            </Button>
                                            <Button
                                                onClick={handleDirectUpload}
                                                className="flex-1 text-xs"
                                                size="sm"
                                                disabled={converterUploading || !converterDeckName.trim()}
                                            >
                                                {converterUploading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                                        {t("admin.uploading")}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-4 h-4 mr-1.5" />
                                                        {t("admin.uploadAsPublic")}
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                                {t("admin.cardsPreview", { count: Math.min(5, parsedConverterCards.length) })}
                                            </span>
                                            <div className="max-h-[120px] overflow-y-auto border border-border/40 rounded bg-background/50 p-2 text-xs divide-y divide-border/30 space-y-1">
                                                {parsedConverterCards.slice(0, 5).map((card, index) => (
                                                    <div key={index} className="pt-1 first:pt-0">
                                                        <span className="font-semibold text-indigo-300">Q:</span> {card.question} <br />
                                                        <span className="font-semibold text-emerald-300">A:</span> {card.answer}
                                                    </div>
                                                ))}
                                                {parsedConverterCards.length > 5 && (
                                                    <div className="text-center text-muted-foreground text-[10px] pt-1">
                                                        + {parsedConverterCards.length - 5} more cards...
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {converterMessage && (
                                    <div className={`flex items-center gap-2 p-3 rounded-lg text-xs ${converterMessage.type === "success"
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : "bg-rose-500/10 text-rose-400"
                                        }`}>
                                        {converterMessage.type === "success" ? (
                                            <Check className="w-4 h-4 shrink-0" />
                                        ) : (
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                        )}
                                        <span className="break-all">{converterMessage.text}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Existing Decks & Users management */}
                    <div className="space-y-8">
                        {/* Existing Public Decks */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-card border border-border rounded-xl p-6 space-y-4 max-h-[500px] overflow-y-auto"
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
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium truncate">{deck.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {t("dashboard.cardsCount", { count: deck.flashcards.length })}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4 shrink-0">
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
                            className="bg-card border border-border rounded-xl p-6 space-y-4 max-h-[500px] overflow-y-auto"
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
            </div>
        </div>
    );
}
