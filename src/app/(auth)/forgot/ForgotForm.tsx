"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";
import { usePrefs } from "@/components/PrefsProvider";
import { Button, Input } from "@/components/ui";
import { ButtonLink } from "@/components/ui/ButtonLink";
import type { StringKey } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/browser";
import { BackButton } from "@/app/play/parts";
import { AuthShell } from "../AuthShell";
import { peekHandoffEmail } from "../authErrors";

export function ForgotForm() {
  const { t } = usePrefs();
  const [email, setEmail] = useState(peekHandoffEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<StringKey | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function send(address: string) {
    setLoading(true);
    setError(null);
    const { error: err } = await createClient().auth.resetPasswordForEmail(address, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (err) {
      setError("errors.GENERIC");
      return false;
    }
    setSentTo(address);
    return true;
  }

  if (sentTo) {
    // "Link sent" state (states/ForgotSent).
    const [before, after] = t("auth.sent_body", { email: "\u0000" }).split("\u0000");
    return (
      <div className="flex min-h-dvh flex-col lg:min-h-0 lg:px-6 lg:pt-6 lg:pb-16">
        <header className="flex h-16 items-center gap-2 px-2 lg:hidden">
          <BackButton onClick={() => setSentTo(null)} label={t("nav.back")} />
        </header>
        <main className="flex flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-[560px] lg:flex-none lg:gap-6 lg:rounded-md lg:bg-surface lg:p-12">
          <div role="status" className="flex flex-col gap-4 px-6 pt-12 lg:p-0">
            <MailCheck aria-hidden size={48} strokeWidth={1.8} className="text-safe" />
            <h1 className="text-title">{t("auth.sent_title")}</h1>
            <p className="text-body">
              {before}
              <bdi dir="ltr">{sentTo}</bdi>
              {after}
            </p>
            <span className="text-caption text-dust">{t("auth.sent_hint")}</span>
          </div>
          <div className="mt-auto flex flex-col gap-2 px-4 pt-4 pb-8 lg:mt-0 lg:p-0">
            {error && (
              <p role="alert" className="text-caption text-alert">
                {t(error)}
              </p>
            )}
            <ButtonLink href="/login" fullWidth>
              {t("auth.sent_back")}
            </ButtonLink>
            <Button variant="secondary" fullWidth loading={loading} onClick={() => void send(sentTo)}>
              {t("auth.sent_again")}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <AuthShell
      backHref="/login"
      title={t("auth.forgot_title")}
      sub={t("auth.forgot_body")}
      onSubmit={() => {
        if (!email.includes("@")) return void document.getElementById("forgot-email")?.focus();
        void send(email.trim());
      }}
      actions={
        <>
          {error && (
            <p role="alert" className="text-caption text-alert">
              {t(error)}
            </p>
          )}
          <Button type="submit" fullWidth loading={loading}>
            {t("auth.forgot_cta")}
          </Button>
        </>
      }
    >
      <Input
        id="forgot-email"
        label={t("auth.email")}
        type="email"
        dir="ltr"
        inputMode="email"
        autoComplete="email"
        placeholder="name@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="text-start lg:bg-ink"
      />
    </AuthShell>
  );
}
