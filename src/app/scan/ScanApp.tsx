"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  CircleAlert,
  Clock,
  HelpCircle,
  ImageUp,
  OctagonAlert,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { usePrefs } from "@/components/PrefsProvider";
import { Button, Isolated, RiskMeter, Segmented } from "@/components/ui";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { BackButton } from "@/app/play/parts";
import { cn } from "@/lib/cn";

type Risk = "low" | "suspicious" | "high";
type Tab = "text" | "image";
type Phase =
  | { kind: "input" }
  | { kind: "loading" }
  | { kind: "result"; risk: Risk; reason: string; actions: string }
  | { kind: "insufficient" }
  | { kind: "error" }
  | { kind: "limit" };
type ImageError = { kind: "size"; sizeMb: number } | { kind: "type" } | null;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

const RISK_STYLE: Record<Risk, { text: string; Icon: typeof ShieldCheck }> = {
  low: { text: "text-safe", Icon: ShieldCheck },
  suspicious: { text: "text-warn", Icon: TriangleAlert },
  high: { text: "text-alert", Icon: OctagonAlert },
};

/** S-1 input (text or image) and S-2 results, with every state from HANDOFF §5. */
export function ScanApp({ initialRemaining, limit }: { initialRemaining: number; limit: number }) {
  const { t } = usePrefs();
  const fileId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [phase, setPhase] = useState<Phase>(initialRemaining <= 0 ? { kind: "limit" } : { kind: "input" });
  const [tab, setTab] = useState<Tab>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<ImageError>(null);

  // The preview URL lives only in this tab; free it when the file changes.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const empty = tab === "text" ? text.trim().length === 0 : !file;

  function pickFile(f: File | null) {
    setImageError(null);
    setFile(null);
    setPreview(null);
    if (!f) return;
    if (!IMAGE_TYPES.includes(f.type)) return setImageError({ kind: "type" });
    if (f.size > MAX_IMAGE_BYTES) return setImageError({ kind: "size", sizeMb: Math.round((f.size / 1048576) * 10) / 10 });
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function backToInput(nextTab?: Tab) {
    if (nextTab) setTab(nextTab);
    setPhase({ kind: "input" });
    window.scrollTo(0, 0);
  }

  function startOver() {
    setText("");
    pickFile(null);
    setTab("text");
    backToInput();
  }

  async function submit() {
    if (empty) return;
    setPhase({ kind: "loading" });
    window.scrollTo(0, 0);
    try {
      let res: Response;
      if (tab === "text") {
        res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "text", text }),
        });
      } else {
        const form = new FormData();
        form.set("type", "image");
        form.set("file", file!);
        res = await fetch("/api/scan", { method: "POST", body: form });
      }
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setRemaining(data.remaining);
        setPhase(data.risk === "insufficient" ? { kind: "insufficient" } : { kind: "result", ...data });
        return;
      }
      switch (data?.error) {
        case "TEXT_TOO_SHORT":
          // HANDOFF §5: too short → "المعلومات ما تكفي نحكم" (not counted).
          return setPhase({ kind: "insufficient" });
        case "DAILY_LIMIT":
          setRemaining(0);
          return setPhase({ kind: "limit" });
        case "IMAGE_TOO_LARGE":
          setImageError({ kind: "size", sizeMb: data.size_mb });
          return backToInput("image");
        case "IMAGE_TYPE":
          setImageError({ kind: "type" });
          return backToInput("image");
        case "AUTH_REQUIRED":
          return window.location.reload();
        default:
          return setPhase({ kind: "error" });
      }
    } catch {
      setPhase({ kind: "error" });
    }
  }

  const remainingLine = t("scan.remaining", { n: remaining, limit });
  const disclaimer = <p className="text-caption text-dust">{t("scan.disclaimer")}</p>;

  // ---- shared chrome -------------------------------------------------------
  const shell = (body: React.ReactNode, actions: React.ReactNode, aside?: React.ReactNode) => (
    <div className="flex min-h-dvh flex-col lg:min-h-0">
      <header className="flex h-16 items-center gap-2 px-2 lg:hidden">
        <BackButton
          href={phase.kind === "input" || phase.kind === "limit" ? "/" : undefined}
          onClick={phase.kind === "input" || phase.kind === "limit" ? undefined : () => backToInput()}
          label={t("nav.back")}
        />
        <span className="flex-1 text-caption text-dust">
          {phase.kind === "result" || phase.kind === "insufficient" ? t("scan.result_title") : t("nav.scan")}
        </span>
        {phase.kind === "input" && <span className="px-2 text-caption text-dust">{remainingLine}</span>}
      </header>
      <div className="flex flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-[1120px] lg:flex-row lg:flex-wrap lg:items-start lg:gap-12 lg:px-6 lg:pt-6 lg:pb-16">
        <div className="flex flex-1 flex-col lg:flex-[1_1_520px] lg:gap-6">
          <main className="flex flex-col gap-6 px-4 pt-2 lg:p-0">{body}</main>
          <div className="mt-auto flex flex-col gap-2 px-4 pt-4 pb-8 lg:mt-0 lg:flex-row lg:flex-wrap lg:p-0">{actions}</div>
        </div>
        {aside && <aside className="hidden min-w-0 flex-col gap-4 lg:flex lg:flex-[1_1_320px]">{aside}</aside>}
      </div>
    </div>
  );
  const primary = "lg:w-auto lg:min-w-60";

  // ---- S-1 input -----------------------------------------------------------
  if (phase.kind === "input") {
    return shell(
      <>
        <div className="flex flex-col gap-2">
          <span className="hidden text-caption text-dust lg:block">{remainingLine}</span>
          <h1 className="text-title lg:text-display">{t("scan.title")}</h1>
        </div>
        <div className="lg:max-w-[360px]">
          <Segmented<Tab>
            name="scan-tab"
            label={t("scan.title")}
            value={tab}
            onChange={(v) => setTab(v)}
            options={[
              { value: "text", label: t("scan.tab_text") },
              { value: "image", label: t("scan.tab_image") },
            ]}
          />
        </div>

        {tab === "text" ? (
          <label className="flex flex-col gap-2">
            <span className="text-caption font-semibold">{t("scan.text_label")}</span>
            <textarea
              rows={6}
              maxLength={4000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("scan.placeholder")}
              className="w-full resize-none rounded-md border border-slip-border bg-slip p-4 text-body text-slip-text outline-none placeholder:text-slip-meta focus:border-2 focus:border-paper lg:p-6 lg:text-title lg:font-normal"
            />
          </label>
        ) : (
          <div className="flex flex-col gap-4">
            <input
              ref={fileInput}
              id={fileId}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            {imageError ? (
              <div role="alert" className="flex items-start gap-4 rounded-md border-2 border-alert bg-surface p-4">
                <CircleAlert aria-hidden size={24} className="shrink-0 text-alert" />
                <span className="flex flex-col gap-1">
                  <b className="text-body">
                    {imageError.kind === "size"
                      ? t("errors.IMAGE_TOO_LARGE", { size: imageError.sizeMb })
                      : t("errors.IMAGE_TYPE")}
                  </b>
                  {imageError.kind === "size" && (
                    <span className="text-body text-dust">{t("errors.IMAGE_TOO_LARGE_HINT")}</span>
                  )}
                </span>
              </div>
            ) : preview ? (
              <div className="flex flex-col gap-2">
                {/* Local preview only (object URL); the image is never stored. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="" className="max-h-72 w-auto self-start rounded-md border border-line" />
                <span dir="auto" className="text-caption text-dust">
                  {file?.name}
                </span>
              </div>
            ) : (
              <label
                htmlFor={fileId}
                className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-line bg-surface p-6 text-center transition-colors hover:bg-line active:bg-line has-[:focus-visible]:outline-2"
              >
                <ImageUp aria-hidden size={32} />
                <span className="text-body font-bold">{t("scan.tab_image")}</span>
              </label>
            )}
            <span className="text-caption text-dust">{t("scan.image_types")}</span>
          </div>
        )}

        <div className="flex items-start gap-4 rounded-md bg-surface p-4 lg:hidden">
          <CircleAlert aria-hidden size={20} className="mt-1 shrink-0 text-warn" />
          <span className="text-body">{t("scan.privacy_tip")}</span>
        </div>
      </>,
      tab === "image" && (imageError || file) ? (
        <>
          {file && !imageError && (
            <Button className={primary} fullWidth onClick={submit}>
              {t("scan.submit")}
            </Button>
          )}
          <Button variant={imageError ? "primary" : "secondary"} fullWidth className={primary} onClick={() => fileInput.current?.click()}>
            {t("scan.choose_other_image")}
          </Button>
          {imageError && (
            <Button variant="secondary" fullWidth className="lg:w-auto" onClick={() => { setImageError(null); setTab("text"); }}>
              {t("scan.paste_instead")}
            </Button>
          )}
        </>
      ) : (
        <Button fullWidth className={primary} disabled={empty} onClick={submit}>
          {empty && tab === "text" ? t("scan.submit_empty") : t("scan.submit")}
        </Button>
      ),
      <>
        <div className="flex flex-col gap-4 rounded-md bg-surface p-6">
          <CircleAlert aria-hidden size={24} className="text-warn" />
          <span className="text-body">{t("scan.privacy_tip")}</span>
        </div>
        <div className="rounded-md border border-line p-6">{disclaimer}</div>
      </>,
    );
  }

  // ---- loading -------------------------------------------------------------
  if (phase.kind === "loading") {
    return shell(
      <>
        <h1 className="text-title">{t("scan.loading_title")}</h1>
        <div className="flex flex-col gap-4 rounded-md border border-slip-border bg-slip p-4 text-slip-text lg:p-6" aria-busy="true">
          {tab === "text" ? (
            <p className="line-clamp-6 text-body whitespace-pre-line">
              <Isolated text={text} />
            </p>
          ) : (
            preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="max-h-48 w-auto self-start rounded-sm" />
            )
          )}
          <span aria-hidden className="h-[3px] animate-pulse rounded-sm bg-stamp" />
        </div>
        <span className="text-caption text-dust">{t("scan.loading_note")}</span>
      </>,
      <Button fullWidth className={primary} loading loadingText={t("scan.submitting")}>
        {t("scan.submit")}
      </Button>,
    );
  }

  // ---- S-2 result ----------------------------------------------------------
  if (phase.kind === "result") {
    const { Icon, text: color } = RISK_STYLE[phase.risk];
    return shell(
      <>
        <section role="status" className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Icon aria-hidden size={44} className={cn("shrink-0", color)} />
            <h1 className={cn("text-display", color)}>{t(`scan.risk.${phase.risk}`)}</h1>
          </div>
          <div className="lg:max-w-[480px]">
            <RiskMeter risk={phase.risk} />
          </div>
          <p className="text-body">{phase.reason}</p>
        </section>
        <section className="flex flex-col gap-2 rounded-md bg-surface p-4 lg:p-6">
          <b className="text-body">{t("scan.what_now")}</b>
          <p className="text-body">{phase.actions}</p>
        </section>
        <div className="lg:hidden">{disclaimer}</div>
      </>,
      <>
        <Button fullWidth className={primary} onClick={startOver}>
          {t("scan.again")}
        </Button>
        {phase.risk === "low" ? (
          <ButtonLink href="/" variant="secondary" fullWidth className="lg:w-auto">
            {t("nav.home")}
          </ButtonLink>
        ) : (
          <ButtonLink href="/learn" variant="secondary" fullWidth className="lg:w-auto">
            {t("scan.learn_more")}
          </ButtonLink>
        )}
      </>,
      <>
        {tab === "text" && (
          <>
            <span className="text-caption text-dust">{t("scan.your_message")}</span>
            <p className="rounded-md border border-slip-border bg-slip p-6 text-body whitespace-pre-line text-slip-text">
              <Isolated text={text} />
            </p>
          </>
        )}
        {disclaimer}
      </>,
    );
  }

  // ---- insufficient (its own screen, no meter) -----------------------------
  if (phase.kind === "insufficient") {
    return shell(
      <div role="status" className="flex flex-col gap-4 pt-6 lg:pt-0">
        <HelpCircle aria-hidden size={48} strokeWidth={1.8} className="text-dust" />
        <h1 className="text-title">{t("scan.insufficient_title")}</h1>
        <p className="text-body">{t("scan.insufficient_body")}</p>
        <span className="text-caption text-dust">{t("scan.insufficient_hint")}</span>
        {disclaimer}
      </div>,
      <>
        <Button fullWidth className={primary} onClick={() => backToInput("text")}>
          {t("scan.insufficient_cta")}
        </Button>
        <Button variant="secondary" fullWidth className="lg:w-auto" onClick={() => backToInput("image")}>
          {t("scan.insufficient_cta2")}
        </Button>
      </>,
    );
  }

  // ---- limit reached -------------------------------------------------------
  if (phase.kind === "limit") {
    return shell(
      <div className="flex flex-col gap-4 pt-6 lg:pt-0">
        <Clock aria-hidden size={48} strokeWidth={1.8} />
        <h1 className="text-title">{t("scan.limit_title")}</h1>
        <p className="text-body">{t("scan.limit_body")}</p>
        <span className="text-caption text-dust">{t("scan.limit_hint")}</span>
      </div>,
      <>
        <ButtonLink href="/play" fullWidth className={primary}>
          {t("scan.limit_cta")}
        </ButtonLink>
        <ButtonLink href="/learn/links" variant="secondary" fullWidth className="lg:w-auto">
          {t("scan.limit_cta2")}
        </ButtonLink>
      </>,
    );
  }

  // ---- error: SCAN_FAILED (not counted, nothing stored) --------------------
  return shell(
    <div role="alert" className="flex flex-col gap-4 pt-6 lg:pt-0">
      <TriangleAlert aria-hidden size={48} strokeWidth={1.8} className="text-warn" />
      <p className="text-body">{t("errors.SCAN_FAILED")}</p>
      <span className="text-caption text-dust">{t("errors.SCAN_FAILED_HINT")}</span>
    </div>,
    <>
      <Button fullWidth className={primary} onClick={submit}>
        {t("scan.retry")}
      </Button>
      <Button variant="secondary" fullWidth className="lg:w-auto" onClick={() => backToInput()}>
        {t("scan.edit_text")}
      </Button>
    </>,
  );
}
