"use client";

import { useEffect, useMemo } from "react";
import { ensureKatexStyles } from "@/lib/latex";
import { renderLatexContent } from "@/lib/latex-render";

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

    const renderedContent = useMemo(() => renderLatexContent(text), [text]);

    return <div className={`whitespace-pre-wrap ${className}`.trim()}>{renderedContent}</div>;
}
