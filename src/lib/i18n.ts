import en from "@/locales/en.json";
import pl from "@/locales/pl.json";

export type Language = "en" | "pl";

type TranslationValue = string | { [key: string]: TranslationValue };

const translations: Record<Language, TranslationValue> = { en, pl };

export function getTranslation(lang: Language, key: string, params: Record<string, string | number> = {}) {
  const keys = key.split(".");
  let value: TranslationValue = translations[lang];

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      return key; // Fallback to key if not found
    }
  }

  if (typeof value !== "string") return key;

  // Simple interpolation
  Object.entries(params).forEach(([k, v]) => {
    value = (value as string).replace(`{{${k}}}`, String(v));
  });

  return value;
}
