"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  dirOf,
  formatNumber,
  getT,
  LANG_KEY,
  parseLocale,
  parseTheme,
  THEME_KEY,
  type Locale,
  type TFn,
  type Theme,
} from "@/lib/i18n";

type Prefs = {
  locale: Locale;
  theme: Theme;
  dir: "rtl" | "ltr";
  setLocale: (l: Locale) => void;
  setTheme: (t: Theme) => void;
  t: TFn;
  n: (value: number) => string;
};

const PrefsContext = createContext<Prefs | null>(null);

const ONE_YEAR = 60 * 60 * 24 * 365;

function writePref(key: string, value: string) {
  document.cookie = `${key}=${value}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode: the cookie still carries the choice.
  }
}

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function applyLocale(l: Locale) {
  const el = document.documentElement;
  el.lang = l;
  el.dir = dirOf(l);
}

function applyTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
}

export function PrefsProvider({
  initialLocale,
  initialTheme,
  children,
}: {
  initialLocale: Locale;
  initialTheme: Theme;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  // When the server sends new cookie values (after router.refresh), follow them.
  const [seen, setSeen] = useState({ initialLocale, initialTheme });
  if (seen.initialLocale !== initialLocale || seen.initialTheme !== initialTheme) {
    setSeen({ initialLocale, initialTheme });
    setLocaleState(initialLocale);
    setThemeState(initialTheme);
  }

  const setLocale = useCallback(
    (l: Locale) => {
      setLocaleState(l);
      applyLocale(l);
      writePref(LANG_KEY, l);
      // Server components re-render with the new cookie.
      router.refresh();
    },
    [router],
  );

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    writePref(THEME_KEY, t);
  }, []);

  // localStorage is the device's memory. If the cookie was lost but
  // localStorage still has a choice, restore the cookie and re-render.
  useEffect(() => {
    const storedLang = readStored(LANG_KEY);
    const storedTheme = readStored(THEME_KEY);
    const lang = storedLang ? parseLocale(storedLang) : initialLocale;
    const th = storedTheme ? parseTheme(storedTheme) : initialTheme;
    writePref(LANG_KEY, lang);
    writePref(THEME_KEY, th);
    if (lang !== initialLocale || th !== initialTheme) {
      applyLocale(lang);
      applyTheme(th);
      router.refresh();
    }
    // Run once on first load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<Prefs>(
    () => ({
      locale,
      theme,
      dir: dirOf(locale),
      setLocale,
      setTheme,
      t: getT(locale),
      n: (v: number) => formatNumber(v, locale),
    }),
    [locale, theme, setLocale, setTheme],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): Prefs {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside <PrefsProvider>");
  return ctx;
}

export function useT(): TFn {
  return usePrefs().t;
}
