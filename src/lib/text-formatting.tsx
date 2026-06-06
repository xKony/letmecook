import { Fragment } from "react";

function renderItalics(textVal: string) {
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

function renderTextSegment(textVal: string) {
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

/** Lightweight text renderer for content without LaTeX (no KaTeX bundle). */
export function PlainTextContent({ text, className = "" }: { text: string; className?: string }) {
    if (!text) return null;

    const lines = text.split("\n");

    return (
        <span className={className}>
            {lines.map((line, lineIndex) => (
                <Fragment key={lineIndex}>
                    {lineIndex > 0 && <br />}
                    {renderTextSegment(line)}
                </Fragment>
            ))}
        </span>
    );
}
