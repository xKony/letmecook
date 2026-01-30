"use client";

import { useMemo } from "react";
import katex from "katex";

interface LatexRendererProps {
    text: string;
    className?: string;
}

/**
 * Renders text with LaTeX support
 * Supports:
 *   - Inline math: $...$
 *   - Display/block math: $$...$$
 */
export function LatexRenderer({ text, className = "" }: LatexRendererProps) {
    const renderedContent = useMemo(() => {
        if (!text) return null;

        // Split text by LaTeX delimiters, preserving the delimiters
        // Handle $$ first (display math), then $ (inline math)
        const parts: { type: "text" | "inline" | "display"; content: string }[] = [];

        // Regex to match $$...$$ (display) and $...$ (inline) but not escaped \$ 
        // Process display math first to avoid conflicts
        let remaining = text;

        // First pass: extract display math ($$...$$)
        const displayRegex = /\$\$([\s\S]*?)\$\$/g;
        let lastIndex = 0;
        let match;
        const tempParts: { type: "text" | "display"; content: string; start: number; end: number }[] = [];

        while ((match = displayRegex.exec(remaining)) !== null) {
            tempParts.push({
                type: "display",
                content: match[1],
                start: match.index,
                end: match.index + match[0].length
            });
        }

        // Build result with display math extracted
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

        // Second pass: extract inline math ($...$) from result
        const inlineRegex = /\$([^\$\n]+?)\$/g;
        const inlinePlaceholders: { placeholder: string; latex: string }[] = [];
        result = result.replace(inlineRegex, (_, latex) => {
            const placeholder = `%%INLINE_${inlinePlaceholders.length}%%`;
            inlinePlaceholders.push({ placeholder, latex });
            return placeholder;
        });

        // Now split by all placeholders and rebuild
        const allPlaceholders = [
            ...displayPlaceholders.map(p => ({ ...p, type: "display" as const })),
            ...inlinePlaceholders.map(p => ({ ...p, type: "inline" as const }))
        ];

        // Split text by placeholders
        const placeholderRegex = /(%%(DISPLAY|INLINE)_\d+%%)/g;
        const segments = result.split(placeholderRegex).filter(s => s && !s.match(/^(DISPLAY|INLINE)$/));

        return segments.map((segment, index) => {
            // Check if this is a display placeholder
            const displayMatch = displayPlaceholders.find(p => p.placeholder === segment);
            if (displayMatch) {
                try {
                    const html = katex.renderToString(displayMatch.latex, {
                        displayMode: true,
                        throwOnError: false,
                        strict: false
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

            // Check if this is an inline placeholder
            const inlineMatch = inlinePlaceholders.find(p => p.placeholder === segment);
            if (inlineMatch) {
                try {
                    const html = katex.renderToString(inlineMatch.latex, {
                        displayMode: false,
                        throwOnError: false,
                        strict: false
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

            // Regular text
            if (segment.trim()) {
                return <span key={index}>{segment}</span>;
            }
            return segment ? <span key={index}>{segment}</span> : null;
        });
    }, [text]);

    return <span className={className}>{renderedContent}</span>;
}
