let katexStylesLoaded = false;

/** Detect inline ($...$) or display ($$...$$) LaTeX delimiters. */
export function containsMath(text: string): boolean {
    return /\$\$[\s\S]+?\$\$/.test(text) || /\$[^$]+?\$/.test(text);
}

/** Load KaTeX CSS once when LatexRenderer mounts (avoids global layout import). */
export function ensureKatexStyles(): void {
    if (katexStylesLoaded || typeof window === "undefined") return;
    katexStylesLoaded = true;
    void import("katex/dist/katex.min.css");
}
