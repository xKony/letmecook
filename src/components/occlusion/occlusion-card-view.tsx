"use client";

import type { Flashcard } from "@/lib/types";
import { getActiveMask, getOcclusionImageSrc } from "@/lib/occlusion";
import { useI18n } from "@/lib/i18n-context";

interface OcclusionCardViewProps {
    card: Flashcard;
    /** Index of the active mask for fallback text (1-based position). */
    maskNumber: number;
    isRevealed: boolean;
    onReveal: () => void;
}

/**
 * Study-mode rendering of an image-occlusion card.
 *
 * Question phase: every mask is covered with a solid box; the mask this
 * card asks about pulses orange. Clicking it (or Space, via the session
 * shortcuts) reveals it.
 * Answer phase: the active mask fades away to show the value; sibling
 * masks stay covered. Rating buttons are unchanged — each mask keeps its
 * own FSRS schedule.
 */
export function OcclusionCardView({ card, maskNumber, isRevealed, onReveal }: OcclusionCardViewProps) {
    const { t } = useI18n();
    const occlusion = card.occlusion;
    const activeMask = occlusion ? getActiveMask(occlusion) : undefined;
    const src = occlusion ? getOcclusionImageSrc(occlusion) : undefined;

    if (!occlusion || !activeMask || !src) return null;

    const prompt = activeMask.label?.trim() || t("occlusion.hiddenPart", { number: maskNumber });

    return (
        <div className="w-full flex flex-col items-center gap-3">
            <p className="text-lg md:text-xl font-semibold text-center text-foreground">
                {prompt}
            </p>
            <div className="relative w-full rounded-xl overflow-hidden border border-border bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt=""
                    draggable={false}
                    width={occlusion.width}
                    height={occlusion.height}
                    className="w-full h-auto block select-none"
                />
                {occlusion.masks.map((mask) => {
                    const isActive = mask.id === activeMask.id;
                    const uncovered = isRevealed && isActive;
                    return (
                        <div
                            key={mask.id}
                            aria-hidden="true"
                            className={`absolute bg-foreground transition-opacity duration-300 ${
                                uncovered ? "opacity-0 pointer-events-none" : "opacity-100"
                            }`}
                            style={{
                                left: `${mask.x * 100}%`,
                                top: `${mask.y * 100}%`,
                                width: `${mask.w * 100}%`,
                                height: `${mask.h * 100}%`,
                            }}
                        />
                    );
                })}
                {!isRevealed && (
                    <button
                        type="button"
                        onClick={onReveal}
                        aria-label={t("occlusion.revealHint")}
                        className="occlusion-active-mask absolute rounded-[2px] cursor-pointer"
                        style={{
                            left: `${activeMask.x * 100}%`,
                            top: `${activeMask.y * 100}%`,
                            width: `${activeMask.w * 100}%`,
                            height: `${activeMask.h * 100}%`,
                        }}
                    />
                )}
            </div>
            {!isRevealed && (
                <p className="text-xs text-muted-foreground text-center">
                    {t("occlusion.revealHint")}
                </p>
            )}
        </div>
    );
}
