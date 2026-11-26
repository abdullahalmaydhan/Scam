"use client";

import { usePrefs } from "@/components/PrefsProvider";
import { Segmented } from "@/components/ui";
import type { Locale, Theme } from "@/lib/i18n";

/** Save the choice to the profile too (HANDOFF §8 rule 12). Best effort. */
export function saveProfilePrefs(body: { language?: Locale; theme?: Theme }) {
  void fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});
}

/**
 * Language (switches dir) and appearance (data-theme). Applies to the whole
 * site at once (decision 28). Guests: this device only. Signed in: also
 * saved in profiles.
 */
export function PrefsSection({ signedIn }: { signedIn: boolean }) {
  const { t, locale, theme, setLocale, setTheme } = usePrefs();
  return (
    <>
      <section className="flex flex-col gap-2">
        <span className="text-caption font-semibold text-dust">{t("settings.language")}</span>
        <Segmented<Locale>
          name="language"
          label={t("settings.language")}
          value={locale}
          onChange={(l) => {
            setLocale(l);
            if (signedIn) saveProfilePrefs({ language: l });
          }}
          options={[
            { value: "ar", label: <span lang="ar">{t("settings.lang_ar")}</span> },
            { value: "en", label: <span lang="en">{t("settings.lang_en")}</span> },
          ]}
        />
      </section>
      <section className="flex flex-col gap-2">
        <span className="text-caption font-semibold text-dust">{t("settings.appearance")}</span>
        <Segmented<Theme>
          name="theme"
          label={t("settings.appearance")}
          value={theme}
          onChange={(v) => {
            setTheme(v);
            if (signedIn) saveProfilePrefs({ theme: v });
          }}
          options={[
            { value: "dark", label: t("settings.dark") },
            { value: "light", label: t("settings.light") },
          ]}
        />
      </section>
      <span className="text-caption text-dust">{t("settings.applies_all")}</span>
    </>
  );
}
