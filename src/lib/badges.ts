import badges from "../../content/badges.json";
import type { Locale } from "@/lib/i18n";

const BY_CODE = new Map(badges.map((b) => [b.code, b]));

/** A badge's name in the current locale (the API returns name_ar only). */
export function badgeName(code: string, locale: Locale, fallback: string): string {
  const b = BY_CODE.get(code);
  if (!b) return fallback;
  return locale === "en" ? b.name_en ?? b.name_ar : b.name_ar;
}
