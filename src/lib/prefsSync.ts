"use client";

import { LANG_KEY, parseLocale, parseTheme, THEME_KEY } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/browser";

/**
 * HANDOFF §8 rule 12: guests keep language/theme on the device; signed-in
 * users keep them in profiles.
 */

function readCookie(key: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${key.replace(".", "\\.")}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function writePref(key: string, value: string) {
  document.cookie = `${key}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  try {
    localStorage.setItem(key, value);
  } catch {}
}

/**
 * After sign-up: the new profile takes the choices made on this device.
 * Call after claimPendingRound, which waits for the session cookie.
 */
export async function saveDevicePrefsToProfile() {
  await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: parseLocale(readCookie(LANG_KEY)),
      theme: parseTheme(readCookie(THEME_KEY)),
    }),
  }).catch(() => {});
}

/** After login: this device takes the choices saved in the profile. */
export async function applyProfilePrefs(userId: string) {
  const { data } = await createClient().from("profiles").select("language, theme").eq("id", userId).maybeSingle();
  if (!data) return;
  writePref(LANG_KEY, parseLocale(data.language));
  writePref(THEME_KEY, parseTheme(data.theme));
}
