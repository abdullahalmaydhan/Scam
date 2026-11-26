import ar from "../../content/ui-strings.ar.json";
import en from "../../content/ui-strings.en.json";

export type Locale = "ar" | "en";
export type Theme = "dark" | "light";

export const LOCALES: readonly Locale[] = ["ar", "en"];
export const THEMES: readonly Theme[] = ["dark", "light"];
export const DEFAULT_LOCALE: Locale = "ar";
export const DEFAULT_THEME: Theme = "dark";

/** Cookie and localStorage keys (HANDOFF decision 28). */
export const LANG_KEY = "sos.lang";
export const THEME_KEY = "sos.theme";

export function parseLocale(v: string | null | undefined): Locale {
  return v === "en" || v === "ar" ? v : DEFAULT_LOCALE;
}
export function parseTheme(v: string | null | undefined): Theme {
  return v === "light" || v === "dark" ? v : DEFAULT_THEME;
}
export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

type Dict = typeof ar;
const DICTS: Record<Locale, Dict> = { ar, en };

/** Every dotted key of ui-strings, e.g. "game.categories.sms.title". */
type Paths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${Paths<T[K]>}`;
}[keyof T & string];
export type StringKey = Paths<Dict>;

export type Vars = Record<string, string | number>;

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";

/** 0-9 → ٠-٩. */
export function toArabicDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => ARABIC_INDIC[Number(d)]);
}

/**
 * A number for the UI: no thousands separator (HANDOFF decision 6),
 * Arabic-Indic digits and "٫" as the decimal separator in Arabic.
 */
export function formatNumber(n: number, locale: Locale): string {
  const s = String(n);
  return locale === "ar" ? toArabicDigits(s.replace(".", "٫")) : s;
}

/** "٧٨٪" in Arabic, "78%" in English (DESIGN.md §8). */
export function formatPercent(n: number, locale: Locale): string {
  return locale === "ar" ? `${formatNumber(n, locale)}٪` : `${n}%`;
}

/** "نوفمبر ٢٠٢٦" / "November 2026" (Gregorian, not Hijri, matching the canvas). */
export function formatMonthYear(isoDate: string, locale: Locale): string {
  const tag = locale === "ar" ? "ar-u-ca-gregory-nu-arab" : "en-u-ca-gregory";
  return new Intl.DateTimeFormat(tag, { month: "long", year: "numeric", timeZone: "Asia/Riyadh" }).format(
    new Date(isoDate),
  );
}

/**
 * Look up a UI string and fill {vars}. In Arabic, every digit in the
 * result becomes Arabic-Indic. Never pass message content (phone numbers,
 * OTP codes, URLs) through t: those keep their stored digits.
 */
export function translate(locale: Locale, key: StringKey, vars?: Vars): string {
  let node: unknown = DICTS[locale];
  for (const part of key.split(".")) {
    node = (node as Record<string, unknown> | undefined)?.[part];
  }
  if (typeof node !== "string") {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] missing key ${key} (${locale})`);
    }
    return key;
  }
  let out = node;
  if (vars) {
    out = out.replace(/\{(\w+)\}/g, (m, name: string) => {
      const v = vars[name];
      if (v === undefined) return m;
      return typeof v === "number" ? formatNumber(v, locale) : v;
    });
  }
  return locale === "ar" ? toArabicDigits(out) : out;
}

export type TFn = (key: StringKey, vars?: Vars) => string;

export function getT(locale: Locale): TFn {
  return (key, vars) => translate(locale, key, vars);
}
