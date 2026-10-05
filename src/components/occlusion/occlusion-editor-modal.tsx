"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import type { EditableCard, OcclusionMask } from "@/lib/types";
import {
    MIN_MASK_EDGE,
    occlusionCardText,
    sanitizeMasks,
} from "@/lib/occlusion";
import {
    compressImageFile,
    extractImageFromDrop,
    extractImageFromPaste,
} from "@/lib/occlusion-image";
import { generateId } from "@/lib/storage";

interface OcclusionEditorModalProps {
    open: boolean;
    onClose: () => void;
    /** Append the generated cards (one per mask) to the deck draft. */
    onGenerate: (cards: EditableCard[]) => void;
}

interface StagedImage {
    dataUrl: string;
    width: number;
    height: number;
    sizeKb: number;
}

interface DraftRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

/**
 * Image-occlusion card factory: paste a screenshot, drag rectangles over the
 * key numbers, optionally label each mask, and generate one flashcard per
 * mask sharing the same image. Works with mouse and touch (Pointer Events).
 */
export function OcclusionEditorModal({ open, onClose, onGenerate }: OcclusionEditorModalProps) {
    const { t } = useI18n();
    const [image, setImage] = useState<StagedImage | null>(null);
    const [masks, setMasks] = useState<OcclusionMask[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [draft, setDraft] = useState<DraftRect | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const stageRef = useRef<HTMLDivElement>(null);
    const drawStartRef = useRef<{ x: number; y: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const reset = useCallback(() => {
        setImage(null);
        setMasks([]);
        setSelectedId(null);
        setDraft(null);
        setBusy(false);
        setError(null);
    }, []);

    const handleClose = useCallback(() => {
        reset();
        onClose();
    }, [reset, onClose]);

    const ingestFile = useCallback(
        async (file: File) => {
            setBusy(true);
            setError(null);
            try {
                const compressed = await compressImageFile(file);
                setImage({
                    dataUrl: compressed.dataUrl,
                    width: compressed.width,
                    height: compressed.height,
                    sizeKb: Math.max(1, Math.round(compressed.sizeBytes / 1024)),
                });
                // A new image invalidates existing masks.
                setMasks([]);
                setSelectedId(null);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : t("occlusion.pasteError")
                );
            } finally {
                setBusy(false);
            }
        },
        [t]
    );

    // Ctrl+V anywhere while the editor is open.
    useEffect(() => {
        if (!open) return;
        const onPaste = (e: ClipboardEvent) => {
            const file = extractImageFromPaste(e);
            if (file) {
                e.preventDefault();
                void ingestFile(file);
            }
        };
        window.addEventListener("paste", onPaste);
        return () => window.removeEventListener("paste", onPaste);
    }, [open, ingestFile]);

    const toFractions = useCallback((clientX: number, clientY: number) => {
        const rect = stageRef.current?.getBoundingClientRect();
        if (!rect || rect.width === 0 || rect.height === 0) return null;
        const clamp = (n: number) => Math.min(1, Math.max(0, n));
        return {
            x: clamp((clientX - rect.left) / rect.width),
            y: clamp((clientY - rect.top) / rect.height),
        };
    }, []);

    const handlePointerDown = useCallback(
        (e: React.PointerEvent) => {
            if (!image || busy) return;
            if ((e.target as HTMLElement).closest("[data-mask-ui]")) return;
            const point = toFractions(e.clientX, e.clientY);
            if (!point) return;
            drawStartRef.current = point;
            stageRef.current?.setPointerCapture(e.pointerId);
            setDraft({ x: point.x, y: point.y, w: 0, h: 0 });
        },
        [image, busy, toFractions]
    );

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            const start = drawStartRef.current;
            if (!start) return;
            const point = toFractions(e.clientX, e.clientY);
            if (!point) return;
            setDraft({
                x: Math.min(start.x, point.x),
                y: Math.min(start.y, point.y),
                w: Math.abs(point.x - start.x),
                h: Math.abs(point.y - start.y),
            });
        },
        [toFractions]
    );

    const handlePointerUp = useCallback(() => {
        const rect = draft;
        drawStartRef.current = null;
        setDraft(null);
        if (!rect || rect.w < MIN_MASK_EDGE || rect.h < MIN_MASK_EDGE) return;
        const id = `mask-${generateId()}`;
        const [clean] = sanitizeMasks([{ id, ...rect }]);
        if (!clean) return;
        setMasks((prev) => [...prev, clean]);
        setSelectedId(id);
    }, [draft]);

    const updateMaskLabel = useCallback((id: string, label: string) => {
        setMasks((prev) =>
            prev.map((m) => (m.id === id ? { ...m, label } : m))
        );
    }, []);

    const deleteMask = useCallback(
        (id: string) => {
            setMasks((prev) => prev.filter((m) => m.id !== id));
            if (selectedId === id) setSelectedId(null);
        },
        [selectedId]
    );

    const handleGenerate = useCallback(() => {
        if (!image) return;
        const clean = sanitizeMasks(masks);
        if (clean.length === 0) return;
        const cards: EditableCard[] = clean.map((mask, index) => ({
            id: `temp-${generateId()}`,
            ...occlusionCardText(mask, index),
            occlusion: {
                imageDataUrl: image.dataUrl,
                width: image.width,
                height: image.height,
                masks: clean,
                activeMaskId: mask.id,
            },
        }));
        onGenerate(cards);
        handleClose();
    }, [image, masks, onGenerate, handleClose]);

    const validMasks = sanitizeMasks(masks);

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-3xl max-h-[92vh] overflow-y-auto" showCloseButton>
                <DialogHeader>
                    <DialogTitle>{t("occlusion.title")}</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        {t("occlusion.description")}
                    </p>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {error && (
                        <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                            {error}
                        </p>
                    )}

                    {!image ? (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const file = extractImageFromDrop(e.nativeEvent);
                                if (file) void ingestFile(file);
                            }}
                            className="w-full min-h-48 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-colors p-8 flex flex-col items-center justify-center gap-3 text-muted-foreground"
                        >
                            {busy ? (
                                <Loader2 className="w-8 h-8 animate-spin" />
                            ) : (
                                <ImagePlus className="w-8 h-8" />
                            )}
                            <span className="text-sm text-center max-w-sm">
                                {busy ? t("common.loading") : t("occlusion.pasteHint")}
                            </span>
                        </button>
                    ) : (
                        <>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {image.width}×{image.height} • {image.sizeKb} KB
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={busy}
                                >
                                    {t("occlusion.replaceImage")}
                                </Button>
                            </div>

                            {/* Draw stage */}
                            <div
                                ref={stageRef}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={() => {
                                    drawStartRef.current = null;
                                    setDraft(null);
                                }}
                                className="relative rounded-xl overflow-hidden border border-border touch-none select-none cursor-crosshair bg-muted/30"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={image.dataUrl}
                                    alt=""
                                    draggable={false}
                                    className="w-full h-auto block pointer-events-none"
                                />
                                {masks.map((mask, index) => (
                                    <button
                                        key={mask.id}
                                        type="button"
                                        data-mask-ui
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedId(mask.id);
                                        }}
                                        title={mask.label || t("occlusion.maskLabel", { number: index + 1 })}
                                        className={`absolute flex items-start justify-start p-0.5 transition-colors ${
                                            selectedId === mask.id
                                                ? "bg-primary/50 outline-2 outline-primary"
                                                : "bg-foreground/60 hover:bg-foreground/70"
                                        }`}
                                        style={{
                                            left: `${mask.x * 100}%`,
                                            top: `${mask.y * 100}%`,
                                            width: `${mask.w * 100}%`,
                                            height: `${mask.h * 100}%`,
                                            outlineStyle: selectedId === mask.id ? "solid" : undefined,
                                        }}
                                    >
                                        <span className="text-[10px] font-bold leading-none bg-background/90 text-foreground rounded px-1 py-0.5">
                                            {index + 1}
                                        </span>
                                    </button>
                                ))}
                                {draft && draft.w > 0 && draft.h > 0 && (
                                    <div
                                        className="absolute bg-primary/40 outline-2 outline-primary pointer-events-none"
                                        style={{
                                            left: `${draft.x * 100}%`,
                                            top: `${draft.y * 100}%`,
                                            width: `${draft.w * 100}%`,
                                            height: `${draft.h * 100}%`,
                                            outlineStyle: "dashed",
                                        }}
                                    />
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t("occlusion.drawHint")}
                            </p>

                            {/* Mask list */}
                            {masks.length > 0 ? (
                                <div className="space-y-2">
                                    {masks.map((mask, index) => (
                                        <div
                                            key={mask.id}
                                            className={`flex items-center gap-2 p-2 rounded-xl border ${
                                                selectedId === mask.id
                                                    ? "border-primary/60 bg-primary/5"
                                                    : "border-border"
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                data-mask-ui
                                                onClick={() => setSelectedId(mask.id)}
                                                className="shrink-0 w-6 h-6 rounded-full bg-muted text-xs font-bold"
                                                aria-label={t("occlusion.maskLabel", { number: index + 1 })}
                                            >
                                                {index + 1}
                                            </button>
                                            <input
                                                type="text"
                                                value={mask.label ?? ""}
                                                onChange={(e) => updateMaskLabel(mask.id, e.target.value)}
                                                onFocus={() => setSelectedId(mask.id)}
                                                placeholder={t("occlusion.maskPromptPlaceholder")}
                                                maxLength={200}
                                                aria-label={t("occlusion.maskPrompt")}
                                                className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/60"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => deleteMask(mask.id)}
                                                aria-label={t("occlusion.deleteMask")}
                                                className="shrink-0 h-8 w-8 text-muted-foreground hover:text-rose-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-2">
                                    {t("occlusion.noMasks")}
                                </p>
                            )}
                        </>
                    )}
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) void ingestFile(file);
                    }}
                />

                <DialogFooter>
                    <Button variant="ghost" onClick={handleClose}>
                        {t("occlusion.cancel")}
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={!image || validMasks.length === 0 || busy}
                    >
                        {t("occlusion.generate", { count: validMasks.length })}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
