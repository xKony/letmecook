import { Fragment, type ReactNode } from "react";

function renderItalics(textVal: string): ReactNode {
    const italicParts = textVal.split(/(\*[^*]+?\*)/g);
    if (italicParts.length > 1) {
        return italicParts.map((part, idx) => {
            if (part.startsWith("*") && part.endsWith("*")) {
                const innerText = part.slice(1, -1);
                return <em key={idx} className="italic text-foreground/90">{innerText}</em>;
            }
            return part;
        });
    }
    return textVal;
}

/** Bold/italic markdown for a single line — no newline expansion. */
export function renderFormattedInlineText(textVal: string): ReactNode {
    const boldParts = textVal.split(/(\*\*.*?\*\*)/g);
    return boldParts.map((boldPart, bpIdx) => {
        if (boldPart.startsWith("**") && boldPart.endsWith("**")) {
            const innerText = boldPart.slice(2, -2);
            return (
                <strong key={`b-${bpIdx}`} className="font-bold text-foreground">
                    {renderItalics(innerText)}
                </strong>
            );
        }
        return <span key={`n-${bpIdx}`}>{renderItalics(boldPart)}</span>;
    });
}

/**
 * Expand literal \n escape sequences for plain text only.
 * Skips LaTeX commands like \neq, \nu, \nabla (backslash-n followed by a letter).
 */
function expandPlainTextNewlines(text: string): string {
    return text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/(?<!\\)\\n(?![a-zA-Z])/g, "\n");
}

/** Lightweight text renderer for content without LaTeX (no KaTeX bundle). */
export function PlainTextContent({ text, className = "" }: { text: string; className?: string }) {
    if (!text) return null;

    const lines = expandPlainTextNewlines(text).split("\n");

    return (
        <span className={className}>
            {lines.map((line, lineIndex) => (
                <Fragment key={lineIndex}>
                    {lineIndex > 0 && <br />}
                    {renderFormattedInlineText(line)}
                </Fragment>
            ))}
        </span>
    );
}
