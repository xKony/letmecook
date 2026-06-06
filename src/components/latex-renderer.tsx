"use client";

import { useEffect, useMemo } from "react";
import katex from "katex";
import { ensureKatexStyles } from "@/lib/latex";
import { renderFormattedInlineText } from "@/lib/text-formatting";

interface LatexRendererProps {
    text: string;
    className?: string;
}

/**
 * Renders text with LaTeX support.
 * Math content ($...$ / $$...$$) is passed to KaTeX as-is — no newline or escape processing.
 */
export function LatexRenderer({ text, className = "" }: LatexRendererProps) {
    useEffect(() => {
        ensureKatexStyles();
    }, []);

    const renderedContent = useMemo(() => {
        if (!text) return null;

        const remaining = text;

        const displayRegex = /\$\$([\s\S]*?)\$\$/g;
        let match;
        const tempParts: { type: "text" | "display"; content: string; start: number; end: number }[] = [];

        while ((match = displayRegex.exec(remaining)) !== null) {
            tempParts.push({
                type: "display",
                content: match[1],
                start: match.index,
                end: match.index + match[0].length,
            });
        }

        let result = "";
        let offset = 0;
        const displayPlaceholders: { placeholder: string; latex: string }[] = [];

        for (const part of tempParts) {
            result += remaining.slice(offset, part.start);
            const placeholder = `%%DISPLAY_${displayPlaceholders.length}%%`;
            displayPlaceholders.push({ placeholder, latex: part.content });
            result += placeholder;
            offset = part.end;
        }
        result += remaining.slice(offset);

        const inlineRegex = /\$([^$]*?)\$/g;
        const inlinePlaceholders: { placeholder: string; latex: string }[] = [];
        result = result.replace(inlineRegex, (_, latex) => {
            const placeholder = `%%INLINE_${inlinePlaceholders.length}%%`;
            inlinePlaceholders.push({ placeholder, latex });
            return placeholder;
        });

        const placeholderRegex = /(%%(DISPLAY|INLINE)_\d+%%)/g;
        const segments = result.split(placeholderRegex).filter((s) => s && !s.match(/^(DISPLAY|INLINE)$/));

        return segments.map((segment, index) => {
            const displayMatch = displayPlaceholders.find((p) => p.placeholder === segment);
            if (displayMatch) {
                try {
                    const html = katex.renderToString(displayMatch.latex, {
                        displayMode: true,
                        throwOnError: false,
                        strict: false,
                    });
                    return (
                        <div
                            key={index}
                            className="my-2 overflow-x-auto"
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    );
                } catch {
                    return <span key={index} className="text-rose-500">{`$$${displayMatch.latex}$$`}</span>;
                }
            }

            const inlineMatch = inlinePlaceholders.find((p) => p.placeholder === segment);
            if (inlineMatch) {
                try {
                    const html = katex.renderToString(inlineMatch.latex, {
                        displayMode: false,
                        throwOnError: false,
                        strict: false,
                    });
                    return (
                        <span
                            key={index}
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    );
                } catch {
                    return <span key={index} className="text-rose-500">{`$${inlineMatch.latex}$`}</span>;
                }
            }

            if (!segment) return null;
            return <span key={index}>{renderFormattedInlineText(segment)}</span>;
        });
    }, [text]);

    return <div className={className}>{renderedContent}</div>;
}
