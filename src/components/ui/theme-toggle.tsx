"use client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Two-pass rendering is necessary to avoid hydration mismatch for theme-specific UI
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "w-16 h-8 rounded-full bg-muted/20 animate-pulse",
          className,
        )}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className={cn(
        "flex w-16 h-8 p-1 rounded-full cursor-pointer border border-border transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
        isDark ? "bg-card" : "bg-background",
        className,
      )}
    >
      <span className="flex justify-between items-center w-full">
        {/* Active icon — slides right on light mode */}
        <span
          className={cn(
            "flex justify-center items-center w-6 h-6 rounded-full bg-secondary text-foreground transition-transform duration-200 ease-out",
            isDark ? "translate-x-0" : "translate-x-8",
          )}
        >
          {isDark ? (
            <Moon className="w-4 h-4" strokeWidth={1.5} />
          ) : (
            <Sun className="w-4 h-4" strokeWidth={1.5} />
          )}
        </span>

        {/* Inactive icon — slides left on light mode */}
        <span
          className={cn(
            "flex justify-center items-center w-6 h-6 rounded-full text-muted-foreground transition-transform duration-200 ease-out",
            isDark ? "bg-transparent translate-x-0" : "-translate-x-8",
          )}
        >
          {isDark ? (
            <Sun className="w-4 h-4" strokeWidth={1.5} />
          ) : (
            <Moon className="w-4 h-4" strokeWidth={1.5} />
          )}
        </span>
      </span>
    </button>
  );
}
