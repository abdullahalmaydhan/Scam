"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { usePrefs } from "@/components/PrefsProvider";
import { Button, Input } from "@/components/ui";
import { ButtonLink } from "@/components/ui/ButtonLink";
import type { StringKey } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/browser";
import { AuthShell } from "../AuthShell";

type Phase = "checking" | "ready" | "invalid" | "done";

export function ResetForm({ code }: { code: string | null }) {
  const { t } = usePrefs();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<{ field: "password" | "confirm" | "form"; key: StringKey } | null>(null);
  const [loading, setLoading] = useState(false);

  // The email link brings a one-time code (PKCE). Exchange it for a recovery session.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const ok = code
        ? !(await supabase.auth.exchangeCodeForSession(code)).error
        : !!(await supabase.auth.getSession()).data.session;
      if (!cancelled) setPhase(ok ? "ready" : "invalid");
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function submit() {
    if (password.length < 8) return setError({ field: "password", key: "errors.PASSWORD_SHORT" });
    if (confirm !== password) return setError({ field: "confirm", key: "errors.PASSWORD_MISMATCH" });
    setLoading(true);
    setError(null);
    const { error: err } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (err) {
      const short = (err as { code?: string }).code === "weak_password";
      setError(short ? { field: "password", key: "errors.PASSWORD_SHORT" } : { field: "form", key: "errors.GENERIC" });
      return;
    }
    setPhase("done");
    router.refresh();
  }

  if (phase === "checking") {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center" aria-busy="true">
        <LoaderCircle aria-hidden size={24} className="animate-spin text-dust" />
      </div>
    );
  }

  if (phase === "invalid" || phase === "done") {
    const done = phase === "done";
    return (
      <AuthShell
        backHref={done ? "/" : "/login"}
        title={t("auth.reset_title")}
        actions={
          <ButtonLink href={done ? "/" : "/forgot"} fullWidth>
            {done ? t("nav.home") : t("auth.forgot_cta")}
          </ButtonLink>
        }
      >
        <p role={done ? "status" : "alert"} className="flex items-start gap-4 rounded-md bg-surface p-4 text-body lg:bg-ink">
          {done ? (
            <CircleCheck aria-hidden size={24} className="shrink-0 text-safe" />
          ) : (
            <CircleAlert aria-hidden size={24} className="shrink-0 text-alert" />
          )}
          {done ? t("auth.reset_done") : t("errors.RESET_LINK_INVALID")}
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      backHref="/login"
      title={t("auth.reset_title")}
      sub={t("auth.reset_body")}
      onSubmit={submit}
      actions={
        <>
          {error?.field === "form" && (
            <p role="alert" className="text-caption text-alert">
              {t(error.key)}
            </p>
          )}
          <Button type="submit" fullWidth loading={loading}>
            {t("auth.reset_cta")}
          </Button>
        </>
      }
    >
      <Input
        label={t("auth.new_password")}
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={error?.field === "password" ? t(error.key) : null}
        footer={error?.field !== "password" && <span className="text-caption text-dust">{t("auth.password_hint")}</span>}
        className="lg:bg-ink"
      />
      <Input
        label={t("auth.confirm_password")}
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={error?.field === "confirm" ? t(error.key) : null}
        className="lg:bg-ink"
      />
    </AuthShell>
  );
}
