"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePrefs } from "@/components/PrefsProvider";
import { Button, Input } from "@/components/ui";
import { claimPendingRound } from "@/lib/game/claim";
import { saveDevicePrefsToProfile } from "@/lib/prefsSync";
import { loadPending } from "@/lib/game/storage";
import type { StringKey } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/browser";
import { AuthShell, SwitchLink } from "../AuthShell";
import { authErrorKind, giveHandoffEmail } from "../authErrors";

type FieldErrors = { email?: StringKey; password?: StringKey; form?: StringKey };

export function SignupForm({ fromResult }: { fromResult: boolean }) {
  const { t } = usePrefs();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [points] = useState(() => (fromResult ? loadPending()?.points ?? 0 : 0));
  const emailTaken = errors.email === "errors.EMAIL_TAKEN";

  async function submit() {
    // An empty name or email has no string of its own in ui-strings: move focus there.
    if (!name.trim()) return void document.getElementById("signup-name")?.focus();
    if (!email.includes("@")) return void document.getElementById("signup-email")?.focus();
    if (password.length < 8) {
      setErrors({ password: "errors.PASSWORD_SHORT" });
      document.getElementById("signup-password")?.focus();
      return;
    }

    setLoading(true);
    setErrors({});
    const { data, error } = await createClient().auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: name.trim() } },
    });
    if (error) {
      setLoading(false);
      const kind = authErrorKind(error);
      if (kind === "EMAIL_TAKEN") setErrors({ email: "errors.EMAIL_TAKEN" });
      else if (kind === "PASSWORD_SHORT") setErrors({ password: "errors.PASSWORD_SHORT" });
      else setErrors({ form: "errors.GENERIC" });
      return;
    }
    if (!data.session) {
      // Email confirmation is on in Supabase: no session yet, so log in instead.
      router.replace("/login");
      return;
    }
    const dest = await claimPendingRound("new", "/", data.session.access_token);
    await saveDevicePrefsToProfile();
    router.replace(dest);
    router.refresh();
  }

  return (
    <AuthShell
      backHref={fromResult ? "/play" : "/"}
      title={t("auth.signup_title")}
      sub={t("auth.signup_sub")}
      onSubmit={submit}
      actions={
        emailTaken ? (
          // HANDOFF §5: email already used → primary "سجّل دخول بهذا البريد".
          <>
            <Button
              fullWidth
              onClick={() => {
                giveHandoffEmail(email.trim());
                router.push(fromResult ? "/login?from=result" : "/login");
              }}
            >
              {t("auth.login_with_email")}
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setErrors({});
                setEmail("");
                document.getElementById("signup-email")?.focus();
              }}
            >
              {t("auth.use_other_email")}
            </Button>
          </>
        ) : (
          <>
            {errors.form && (
              <p role="alert" className="text-caption text-alert">
                {t(errors.form)}
              </p>
            )}
            <Button type="submit" fullWidth loading={loading}>
              {points > 0 ? t("auth.signup_cta_points", { points }) : t("auth.signup_cta")}
            </Button>
            <SwitchLink
              href={fromResult ? "/login?from=result" : "/login"}
              lead={t("auth.have_account")}
              cta={t("auth.login")}
            />
          </>
        )
      }
    >
      <Input
        id="signup-name"
        label={t("auth.name")}
        autoComplete="name"
        required
        maxLength={80}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="lg:bg-ink"
      />
      <Input
        id="signup-email"
        label={t("auth.email")}
        type="email"
        dir="ltr"
        inputMode="email"
        autoComplete="email"
        placeholder="name@example.com"
        required
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (emailTaken) setErrors({});
        }}
        error={errors.email ? t(errors.email) : null}
        className="text-start lg:bg-ink"
      />
      <Input
        id="signup-password"
        label={t("auth.password")}
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password ? t(errors.password) : null}
        footer={!errors.password && <span className="text-caption text-dust">{t("auth.password_hint")}</span>}
        className="lg:bg-ink"
      />
    </AuthShell>
  );
}
