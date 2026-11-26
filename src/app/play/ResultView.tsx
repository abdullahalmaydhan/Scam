"use client";

import Link from "next/link";
import { CircleAlert, CircleCheck } from "lucide-react";
import { usePrefs } from "@/components/PrefsProvider";
import { badgeName } from "@/lib/badges";
import { BadgeChip, Button, Isolated, ScoreRing } from "@/components/ui";
import { ButtonLink } from "@/components/ui/ButtonLink";
import type { ResultState } from "@/lib/game/storage";
import { BackButton, useRoundLabel } from "./parts";

/**
 * G-5: score ring, summary, guest box (or saved line), review of the wrong
 * answers, and only two actions (HANDOFF decision 20).
 */
export function ResultView({ state, onOther }: { state: ResultState; onOther: () => void }) {
  const { t, locale } = usePrefs();
  const label = useRoundLabel();
  const r = state.result;
  const wrong = r.total - r.correct;
  const perfect = wrong === 0;
  const [open, close] = locale === "ar" ? ["«", "»"] : ["“", "”"];
  const answerLabel = (a: "scam" | "safe") => t(a === "scam" ? "game.answer_scam" : "game.answer_safe");

  // "+٧٠ نقطة · ٣ غلط · ٧٠٪": keep "+٧٠" together in RTL.
  const summary = t("result.summary", { points: r.points, wrong, percent: r.percent });
  const [lead, ...rest] = summary.split(" ");

  const actions = (
    <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:gap-4">
      <Button fullWidth className="lg:w-auto lg:min-w-60 lg:px-8" onClick={onOther}>
        {t("result.other")}
      </Button>
      <ButtonLink href="/" variant="secondary" fullWidth className="lg:w-auto">
        {t("result.home")}
      </ButtonLink>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col lg:min-h-0">
      <header className="flex h-16 items-center gap-2 px-2 lg:hidden">
        <BackButton href="/" label={t("nav.home")} />
        <span className="text-caption text-dust">{label(state.mode, state.difficulty)}</span>
      </header>

      <main className="flex flex-1 flex-col gap-6 p-4 lg:mx-auto lg:w-full lg:max-w-[1120px] lg:flex-row lg:flex-wrap lg:items-start lg:gap-12 lg:px-6 lg:pt-6 lg:pb-16">
        <div className="flex min-w-0 flex-col gap-6 lg:flex-[1_1_480px]">
          <span className="hidden text-caption text-dust lg:block">{label(state.mode, state.difficulty)}</span>

          <section className="flex items-center gap-6">
            <ScoreRing correct={r.correct} total={r.total} />
            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="text-title">{perfect ? t("result.headline_perfect") : t("result.headline", { n: r.correct })}</h1>
              <p className="text-body text-dust">
                {lead.startsWith("+") ? <bdi dir="ltr">{lead}</bdi> : lead} {rest.join(" ")}
              </p>
            </div>
          </section>

          {state.claim === "failed" ? (
            <p role="alert" className="flex items-start gap-4 rounded-md bg-surface p-4 text-body">
              <CircleAlert aria-hidden size={24} className="shrink-0 text-alert" />
              {t("errors.CLAIM_NOT_ALLOWED")}
            </p>
          ) : r.saved ? (
            <section role="status" className="flex flex-col gap-4 rounded-md bg-surface p-4">
              <p className="flex items-start gap-4 text-body">
                <CircleCheck aria-hidden size={24} className="shrink-0 text-safe" />
                {state.claim === "new"
                  ? t("result.saved_new_account", { points: r.points })
                  : t("result.saved", { points: r.points, total: r.total_points ?? r.points })}
              </p>
              {r.new_badges.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-caption text-dust">{t("result.new_badge")}</span>
                  {r.new_badges.map((b) => (
                    <BadgeChip key={b.code} name={badgeName(b.code, locale, b.name_ar)} earned />
                  ))}
                </div>
              )}
            </section>
          ) : (
            r.points > 0 && (
              <section className="flex flex-col gap-4 rounded-md bg-surface p-4">
                <p className="text-body">{t("result.guest", { points: r.points })}</p>
                <Link
                  href="/signup?from=result"
                  className="flex min-h-12 items-center justify-center rounded-md border border-paper px-4 text-body font-bold transition-colors hover:bg-line active:bg-line"
                >
                  {t("result.guest_cta", { points: r.points })}
                </Link>
              </section>
            )
          )}

          <div className="hidden lg:block">{actions}</div>
        </div>

        {r.wrong.length > 0 && (
          <section className="flex min-w-0 flex-col gap-2 lg:flex-[1_1_400px] lg:gap-4">
            <h2 className="mb-2 text-title lg:mb-0">{t("result.review_title", { n: r.wrong.length })}</h2>
            {r.wrong.map((w) => {
              const body = locale === "en" ? w.body_en ?? w.body : w.body;
              const why = locale === "en" ? w.explanation_en ?? w.explanation : w.explanation;
              return (
                <article key={w.position} className="flex flex-col gap-2 rounded-md bg-surface p-4">
                  <span className="text-caption text-dust">
                    {t("result.review_line", { yours: answerLabel(w.your_answer), right: answerLabel(w.correct_answer) })}
                  </span>
                  <p className="text-body text-dust">
                    {open}
                    <Isolated text={body} />
                    {close}
                  </p>
                  <p className="text-body font-bold">{why}</p>
                </article>
              );
            })}
          </section>
        )}
      </main>

      <footer className="px-4 pt-2 pb-8 lg:hidden">{actions}</footer>
    </div>
  );
}
