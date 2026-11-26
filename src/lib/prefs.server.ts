import "server-only";
import { cookies } from "next/headers";
import { getT, LANG_KEY, parseLocale, parseTheme, THEME_KEY } from "@/lib/i18n";

/** Language and theme for this request, from the sos.* cookies. */
export async function getPrefs() {
  const store = await cookies();
  const locale = parseLocale(store.get(LANG_KEY)?.value);
  const theme = parseTheme(store.get(THEME_KEY)?.value);
  return { locale, theme, t: getT(locale) };
}
