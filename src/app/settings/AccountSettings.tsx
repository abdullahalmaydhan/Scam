"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { usePrefs } from "@/components/PrefsProvider";
import { Button, Input, Sheet } from "@/components/ui";
import type { StringKey } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/browser";

type Props = {
  displayName: string;
  email: string;
  stats: { points: number; badges: number; rounds: number };
};

const row =
  "flex min-h-14 w-full items-center px-4 py-2 text-start text-body transition-colors hover:bg-line active:bg-line";

/** P-2 account part: name and email, change password, logout, delete account. */
export function AccountSettings({ displayName, email, stats }: Props) {
  const { t } = usePrefs();
  const router = useRouter();
  const [open, setOpen] = useState<null | "name" | "password" | "delete">(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ field: string; key: StringKey } | null>(null);
  const [name, setName] = useState(displayName);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordDone, setPasswordDone] = useState(false);

  function close() {
    setOpen(null);
    setError(null);
    setLoading(false);
  }

  async function saveName() {
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: name.trim() }),
    }).catch(() => null);
    setLoading(false);
    if (!res?.ok) return setError({ field: "form", key: "errors.GENERIC" });
    close();
    router.refresh();
  }

  async function savePassword() {
    if (password.length < 8) return setError({ field: "password", key: "errors.PASSWORD_SHORT" });
    if (confirm !== password) return setError({ field: "confirm", key: "errors.PASSWORD_MISMATCH" });
    setLoading(true);
    setError(null);
    const { error: err } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (err) {
      const short = (err as { code?: string }).code === "weak_password";
      return setError(short ? { field: "password", key: "errors.PASSWORD_SHORT" } : { field: "form", key: "errors.GENERIC" });
    }
    setPassword("");
    setConfirm("");
    setPasswordDone(true);
  }

  async function logout() {
    setLoading(true);
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  async function deleteAccount() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "DELETE" }),
    }).catch(() => null);
    if (!res?.ok) {
      setLoading(false);
      return setError({ field: "form", key: "errors.GENERIC" });
    }
    // Signed out → home (HANDOFF §5).
    await createClient().auth.signOut().catch(() => {});
    router.replace("/");
    router.refresh();
  }

  const formError = error?.field === "form" && (
    <p role="alert" className="text-caption text-alert">
      {t(error.key)}
    </p>
  );

  return (
    <>
      <section className="flex flex-col gap-2">
        <span className="text-caption font-semibold text-dust">{t("settings.account")}</span>
        <div className="flex flex-col overflow-hidden rounded-md border border-line bg-surface">
          <button type="button" className={row} onClick={() => setOpen("name")}>
            <span className="flex flex-col">
              <span>{t("settings.name_email")}</span>
              <span className="text-caption text-dust">
                <bdi>{displayName}</bdi> · <bdi dir="ltr">{email}</bdi>
              </span>
            </span>
          </button>
          <span className="h-px bg-line" />
          <button
            type="button"
            className={row}
            onClick={() => {
              setPasswordDone(false);
              setOpen("password");
            }}
          >
            {t("settings.change_password")}
          </button>
          <span className="h-px bg-line" />
          <button type="button" className={row} onClick={logout} disabled={loading && open === null}>
            {t("settings.logout")}
          </button>
        </div>
      </section>

      <section className="mt-4 flex flex-col gap-2">
        <Button variant="destructive" fullWidth onClick={() => setOpen("delete")}>
          {t("settings.delete")}
        </Button>
        <span className="text-center text-caption text-dust">{t("settings.delete_note")}</span>
      </section>

      <Sheet open={open === "name"} onClose={close} title={t("settings.name_email")}>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void saveName();
          }}
        >
          <Input
            label={t("auth.name")}
            value={name}
            maxLength={80}
            autoComplete="name"
            onChange={(e) => setName(e.target.value)}
            className="bg-ink"
          />
          <Input label={t("auth.email")} value={email} dir="ltr" readOnly className="text-start text-dust bg-ink" />
          {formError}
          <Button type="submit" fullWidth loading={loading}>
            {t("settings.save")}
          </Button>
        </form>
      </Sheet>

      <Sheet open={open === "password"} onClose={close} title={t("settings.change_password")}>
        {passwordDone ? (
          <>
            <p role="status" className="flex items-start gap-4 text-body">
              <CircleCheck aria-hidden size={24} className="shrink-0 text-safe" />
              {t("settings.password_changed")}
            </p>
            <Button variant="secondary" fullWidth onClick={close}>
              {t("nav.back")}
            </Button>
          </>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void savePassword();
            }}
          >
            <Input
              label={t("auth.new_password")}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error?.field === "password" ? t(error.key) : null}
              className="bg-ink"
            />
            <Input
              label={t("auth.confirm_password")}
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={error?.field === "confirm" ? t(error.key) : null}
              className="bg-ink"
            />
            {formError}
            <Button type="submit" fullWidth loading={loading}>
              {t("auth.reset_cta")}
            </Button>
          </form>
        )}
      </Sheet>

      <Sheet open={open === "delete"} onClose={close} title={t("settings.delete_title")}>
        <p className="text-body text-dust">
          {t("settings.delete_body", { points: stats.points, badges: stats.badges, rounds: stats.rounds })}
        </p>
        {formError}
        <div className="mt-2 flex flex-col gap-2">
          <Button variant="destructive-confirm" fullWidth loading={loading} onClick={deleteAccount}>
            {t("settings.delete_confirm")}
          </Button>
          <Button variant="secondary" fullWidth onClick={close} disabled={loading}>
            {t("settings.delete_cancel")}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
