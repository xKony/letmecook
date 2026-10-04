import { cn } from "@/lib/utils";

interface ProgressBarProps {
    value: number;
    className?: string;
    indicatorClassName?: string;
}

export function ProgressBar({ value, className, indicatorClassName }: ProgressBarProps) {
    const clamped = Math.min(Math.max(value, 0), 100);

    return (
        <div
            role="progressbar"
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={100}
            className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
        >
            <div
                className={cn(
                    "h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-[width] duration-300 ease-out",
                    indicatorClassName
                )}
                style={{ width: `${clamped}%` }}
            />
        </div>
    );
}
