"use client";

import { useState } from "react";
import { ImageOff, ZoomIn } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { isAllowedImageUrl } from "@/lib/image-url";
import dynamic from "next/dynamic";

const LatexRenderer = dynamic(() => import("@/components/latex-renderer").then(mod => mod.LatexRenderer), {
    ssr: true,
});

interface FlashcardContentProps {
    text: string;
    isLarge?: boolean;
    onImageZoom: (url: string) => void;
}

export function FlashcardContent({
    text,
    isLarge = false,
    onImageZoom,
}: FlashcardContentProps) {
    const { t } = useApp();
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

    if (!text) return null;

    const parts = text.split(/(\[img:.*?\])/g);

    return (
        <div className="flex flex-col items-center gap-3">
            {parts.map((part, index) => {
                const imgMatch = part.match(/\[img:(.*?)\]/);
                
                if (imgMatch) {
                    const imageUrl = imgMatch[1].trim();
                    const allowed = isAllowedImageUrl(imageUrl);
                    const hasError = !allowed || imageErrors.has(imageUrl);

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
                                referrerPolicy="no-referrer"
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

                if (part.trim()) {
                    return <LatexRenderer key={index} text={part} />;
                }
                return null;
            })}
        </div>
    );
}
