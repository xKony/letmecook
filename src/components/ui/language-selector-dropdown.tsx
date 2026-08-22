import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { Language } from "@/lib/i18n";
import { useState, useRef, useEffect } from "react";

const languages: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
];

export const LanguageSelectorDropdown = () => {
  const { language, setLanguage } = useI18n();
  const selected = languages.find((l) => l.code === language) || languages[0];
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 rounded-full border h-8 px-3 text-sm transition-colors",
          "bg-white border-zinc-200 text-zinc-800",
          "dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-200",
          "hover:bg-zinc-50 dark:hover:bg-zinc-900"
        )}
      >
        <span className="flex-shrink-0">{selected.flag}</span>
        <span className="hidden sm:inline whitespace-nowrap">{selected.label}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60 flex-shrink-0" strokeWidth={2} />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div
          className={cn(
            "absolute right-0 sm:left-0 mt-2 w-40 rounded-xl overflow-hidden z-50",
            "bg-white dark:bg-zinc-950",
            "shadow-xl border border-zinc-200 dark:border-zinc-800",
            "animate-fade-in"
          )}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors",
                selected.code === lang.code
                  ? "font-semibold text-blue-600 dark:text-blue-400 bg-zinc-50 dark:bg-zinc-900"
                  : "text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              )}
            >
              <span>{lang.flag}</span>
              <span className="flex-1">{lang.label}</span>
              {selected.code === lang.code && (
                <Check className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export { LanguageSelectorDropdown as Component };
