"use client";

import { useState } from "react";
import { ImageOff, ZoomIn } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { containsMath } from "@/lib/latex";
import { PlainTextContent } from "@/lib/text-formatting";
import dynamic from "next/dynamic";

const LatexRenderer = dynamic(
    () => import("@/components/latex-renderer").then((mod) => mod.LatexRenderer),
    { ssr: true }
);

/**
 * Props for the FlashcardContent component.
 */
interface FlashcardContentProps {
    /** The text content to render (may contain [img:URL] and LaTeX). */
    text: string;
    /** Whether to render with large styling (e.g., for the question). */
    isLarge?: boolean;
    /** Callback when an image is clicked for zooming. */
    onImageZoom: (url: string) => void;
}

/**
 * Renders the content of a flashcard, supporting:
 * 1. Plain text
 * 2. LaTeX formulas (via LatexRenderer)
 * 3. Inline images with syntax [img:URL]
 * 
 * @param props - Component props.
 * @returns The rendered content.
 */
export function FlashcardContent({
    text,
    isLarge = false,
    onImageZoom,
}: FlashcardContentProps) {
    const { t } = useI18n();
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

    if (!text) return null;

    // Split by [img:...] pattern, keeping the delimiters
    const parts = text.split(/(\[img:.*?\])/g);

    return (
        <div className="flex flex-col items-center gap-3">
            {parts.map((part, index) => {
                const imgMatch = part.match(/\[img:(.*?)\]/);
                
                if (imgMatch) {
                    const imageUrl = imgMatch[1];
                    const hasError = imageErrors.has(imageUrl);

                    if (hasError) {
                        return (
                            <div key={index} className="flex items-center gap-2 text-muted-foreground text-sm">
                                <ImageOff className="w-4 h-4" />
                                <span>{t("study.imageFailed")}</span>
                            </div>
                        );
                    }

                    return (
                        <div key={index} className="relative group/img">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imageUrl}
                                alt="Flashcard image"
                                className={`rounded-lg cursor-zoom-in shadow-md hover:shadow-lg transition-all active:scale-[0.98] ${isLarge ? 'max-h-48' : 'max-h-32'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onImageZoom(imageUrl);
                                }}
                                onError={() => setImageErrors(prev => new Set(prev).add(imageUrl))}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/20 rounded-lg pointer-events-none">
                                <ZoomIn className="w-6 h-6 text-white drop-shadow-lg" />
                            </div>
                        </div>
                    );
                }

                if (part.length > 0) {
                    if (containsMath(part)) {
                        return <LatexRenderer key={index} text={part} />;
                    }
                    return <PlainTextContent key={index} text={part} />;
                }
                return null;
            })}
        </div>
    );
}
