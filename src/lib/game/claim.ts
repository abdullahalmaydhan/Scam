"use client";

import { clearPending, loadPending, loadResult, saveResult } from "./storage";
import type { NewBadge } from "./types";

/**
 * The Supabase browser client writes its session cookie a moment after
 * signUp/signIn resolve. Wait for it (up to 3s) so the next page's server
 * render already sees the signed-in user (header avatar + "حسابي").
 */
async function sessionCookieWritten(): Promise<void> {
  for (let i = 0; i < 30; i++) {
    if (/(?:^|;\s*)sb-[^=]+-auth-token(?:\.0)?=/.test(document.cookie)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
}

/**
 * Right after sign-up or login (API.md): if a guest round is waiting in
 * sessionStorage.pendingRound, claim it. The key is cleared afterwards,
 * even on error. Returns where to go next.
 */
export async function claimPendingRound(
  kind: "new" | "existing",
  fallback: string,
  accessToken: string,
): Promise<string> {
  await sessionCookieWritten();
  const pending = loadPending();
  if (!pending) return fallback;
  clearPending();
  // Only a submitted round can be claimed (its points were saved after submit).
  if (pending.points === undefined) return fallback;

  const cached = loadResult();
  const matches = cached?.session_id === pending.session_id;
  try {
    const res = await fetch("/api/game/claim", {
      method: "POST",
      // The token, not the cookie: the cookie may not be written yet right after sign-up.
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ session_id: pending.session_id, claim_token: pending.claim_token }),
    });
    const data = (await res.json().catch(() => null)) as
      | { points: number; total_points: number; new_badges: NewBadge[] }
      | null;
    if (!matches || !cached) return fallback;
    if (res.ok && data) {
      saveResult({
        ...cached,
        claim: kind,
        result: { ...cached.result, saved: true, total_points: data.total_points, new_badges: data.new_badges },
      });
    } else {
      // CLAIM_NOT_ALLOWED (or any failure): keep the new account, show the message.
      saveResult({ ...cached, claim: "failed" });
    }
    return "/play";
  } catch {
    if (matches && cached) {
      saveResult({ ...cached, claim: "failed" });
      return "/play";
    }
    return fallback;
  }
}
