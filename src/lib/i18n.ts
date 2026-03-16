import en from "@/locales/en.json";
import pl from "@/locales/pl.json";

export type Language = "en" | "pl";

const translations: Record<Language, any> = { en, pl };

export function getTranslation(lang: Language, key: string, params: Record<string, string | number> = {}) {
  const keys = key.split(".");
  let value = translations[lang];

  for (const k of keys) {
    if (value && value[k]) {
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
