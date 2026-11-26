"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrefs } from "@/components/PrefsProvider";
import { Button, Input } from "@/components/ui";
import { claimPendingRound } from "@/lib/game/claim";
import { applyProfilePrefs } from "@/lib/prefsSync";
import { loadPending } from "@/lib/game/storage";
import { createClient } from "@/lib/supabase/browser";
import type { StringKey } from "@/lib/i18n";
import { AuthShell, SwitchLink } from "../AuthShell";
import { authErrorKind, clearHandoffEmail, peekHandoffEmail } from "../authErrors";

export function LoginForm({ fromResult, next }: { fromResult: boolean; next: string }) {
  const { t } = usePrefs();
  const router = useRouter();
  const [email, setEmail] = useState(peekHandoffEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<StringKey | null>(null);
  // The points message shows only when coming from a game result (decision 26).
  const [points] = useState(() => (fromResult ? loadPending()?.points ?? 0 : 0));

  async function submit() {
    if (!email.trim() || !password) {
      setError("errors.LOGIN_FAILED");
      return;
    }
    setLoading(true);
    setError(null);
    clearHandoffEmail();
    const { data, error: err } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (err) {
      setLoading(false);
      const kind = authErrorKind(err);
      setError(kind === "LOGIN_FAILED" ? "errors.LOGIN_FAILED" : "errors.GENERIC");
      return;
    }
    const dest = await claimPendingRound("existing", next, data.session?.access_token ?? "");
    if (data.user) await applyProfilePrefs(data.user.id);
    router.replace(dest);
    router.refresh();
  }

  return (
    <AuthShell
      backHref={fromResult ? "/play" : "/"}
      title={t("auth.login_title")}
      sub={points > 0 ? t("auth.login_points_note", { points }) : undefined}
      onSubmit={submit}
      actions={
        <>
          <Button type="submit" fullWidth loading={loading}>
            {points > 0 ? t("auth.login_cta_points") : t("auth.login_cta")}
          </Button>
          <SwitchLink
            href={fromResult ? "/signup?from=result" : "/signup"}
            lead={t("auth.no_account")}
            cta={t("auth.create")}
          />
        </>
      }
    >
      <Input
        label={t("auth.email")}
        type="email"
        dir="ltr"
        autoComplete="email"
        inputMode="email"
        placeholder="name@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="text-start lg:bg-ink"
      />
      <Input
        label={t("auth.password")}
        type="password"
        autoComplete="current-password"
        placeholder={t("auth.password_hint")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={error ? t(error) : null}
        className="lg:bg-ink"
      />
      <Link
        href="/forgot"
        className="flex min-h-11 items-center self-start text-body font-semibold underline underline-offset-[6px]"
      >
        {t("auth.forgot")}
      </Link>
    </AuthShell>
  );
}
