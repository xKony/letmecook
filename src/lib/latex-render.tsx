import type { ReactNode } from "react";
import katex from "katex";
import { renderFormattedInlineText } from "@/lib/text-formatting";

const katexHtmlCache = new Map<string, string>();

function renderKatexHtml(latex: string, displayMode: boolean): string | null {
    const cacheKey = `${displayMode ? "d" : "i"}:${latex}`;
    const cached = katexHtmlCache.get(cacheKey);
    if (cached !== undefined) return cached;

    try {
        const html = katex.renderToString(latex, {
            displayMode,
            throwOnError: false,
            strict: false,
        });
        katexHtmlCache.set(cacheKey, html);
        return html;
    } catch {
        return null;
    }
}

/** Parse text with $...$ / $$...$$ delimiters into React nodes. KaTeX output is cached. */
export function renderLatexContent(text: string): ReactNode[] | null {
    if (!text) return null;

    const displayRegex = /\$\$([\s\S]*?)\$\$/g;
    let match;
    const displayParts: { content: string; start: number; end: number }[] = [];

    while ((match = displayRegex.exec(text)) !== null) {
        displayParts.push({
            content: match[1],
            start: match.index,
            end: match.index + match[0].length,
        });
    }

    let result = "";
    let offset = 0;
    const displayPlaceholders: { placeholder: string; latex: string }[] = [];

    for (const part of displayParts) {
        result += text.slice(offset, part.start);
        const placeholder = `%%DISPLAY_${displayPlaceholders.length}%%`;
        displayPlaceholders.push({ placeholder, latex: part.content });
        result += placeholder;
        offset = part.end;
    }
    result += text.slice(offset);

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
            const html = renderKatexHtml(displayMatch.latex, true);
            if (html) {
                return (
                    <div
                        key={index}
                        className="my-2 overflow-x-auto pointer-events-none"
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                );
            }
            return <span key={index} className="text-rose-500">{`$$${displayMatch.latex}$$`}</span>;
        }

        const inlineMatch = inlinePlaceholders.find((p) => p.placeholder === segment);
        if (inlineMatch) {
            const html = renderKatexHtml(inlineMatch.latex, false);
            if (html) {
                return (
                    <span
                        key={index}
                        className="pointer-events-none"
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                );
            }
            return <span key={index} className="text-rose-500">{`$${inlineMatch.latex}$`}</span>;
        }

        if (!segment) return null;
        return <span key={index}>{renderFormattedInlineText(segment)}</span>;
    });
}
