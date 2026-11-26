"use client";

import { useState } from "react";
import { WifiOff, X } from "lucide-react";
import { usePrefs } from "@/components/PrefsProvider";
import { AnswerButtons, Button, MessageSlip, ProgressBar, Sheet, type Answer } from "@/components/ui";
import { localizeMessage } from "@/lib/game/localize";
import type { RoundState } from "@/lib/game/storage";
import type { StringKey } from "@/lib/i18n";
import { useRoundLabel } from "./parts";

export type SubmitState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "failed"; error: StringKey; retry: boolean };

/** G-3 (one question at a time) with the G-4 exit sheet. */
export function QuestionStep({
  round,
  index,
  chosen,
  submit,
  onAnswer,
  onRetry,
  onLeave,
  onRestart,
}: {
  round: RoundState;
  /** 0-based index of the question on screen. */
  index: number;
  /** The answer just tapped, while the stamp prints. */
  chosen: Answer | null;
  submit: SubmitState;
  onAnswer: (a: Answer) => void;
  onRetry: () => void;
  onLeave: () => void;
  onRestart: () => void;
}) {
  const { t, locale } = usePrefs();
  const label = useRoundLabel();
  const [exitOpen, setExitOpen] = useState(false);
  const q = round.questions[index];
  const m = localizeMessage(q, locale);
  const answered = Object.keys(round.answers).length;
  const locked = submit.kind !== "idle";
  // During submit the last stamp stays on the slip.
  const stamp = chosen ?? (locked ? round.answers[q.position] ?? null : null);

  return (
    <div className="flex min-h-dvh flex-col lg:min-h-0">
      <header className="flex flex-col gap-2 px-2 pt-2 pb-4 lg:mx-auto lg:w-full lg:max-w-[720px] lg:flex-row lg:flex-wrap lg:items-center lg:gap-6 lg:p-6">
        <div className="flex items-center gap-2 lg:contents">
          <button
            type="button"
            onClick={() => setExitOpen(true)}
            className="flex min-h-11 items-center gap-2 rounded-md border border-line px-4 text-caption font-semibold transition-colors hover:bg-line active:bg-surface lg:order-1"
          >
            <X aria-hidden size={18} />
            {t("game.exit")}
          </button>
          <span className="flex-1 lg:hidden" />
          <span className="px-2 text-caption text-dust lg:order-3 lg:px-0">{label(round.mode, round.difficulty)}</span>
        </div>
        <div className="flex items-center gap-4 px-2 lg:order-2 lg:flex-[1_1_200px] lg:px-0">
          <ProgressBar value={answered} max={round.total} label={t("game.round_progress")} />
          <span className="shrink-0 text-caption font-bold">{t("game.progress", { i: index + 1, n: round.total })}</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pt-2 lg:mx-auto lg:w-full lg:max-w-[720px] lg:px-6 lg:pb-16">
        {submit.kind === "failed" && (
          <div role="alert" className="flex flex-col gap-4 rounded-md border border-warn bg-surface p-4">
            <p className="flex items-start gap-2 text-body">
              <WifiOff aria-hidden size={20} className="mt-1 shrink-0 text-warn" />
              {t(submit.error)}
            </p>
            {submit.retry ? (
              <Button variant="secondary" onClick={onRetry}>
                {t("errors.NETWORK_CTA")}
              </Button>
            ) : (
              <Button variant="secondary" onClick={onRestart}>
                {t("result.other")}
              </Button>
            )}
          </div>
        )}

        <h1 className="font-body text-caption font-normal text-dust">{t(`game.prompt.${q.category}`)}</h1>
        <section aria-label={t("game.message")} aria-live="polite">
          <MessageSlip
            key={q.position}
            category={q.category}
            sender={m.sender}
            meta={m.meta}
            subject={m.subject}
            body={m.body}
            link={q.link}
            stamp={stamp}
            stampAnimate
          />
        </section>
        {q.link && <span className="text-caption text-dust">{t("game.links_note")}</span>}

        <footer className="mt-auto pt-4 pb-8 lg:mt-4 lg:p-0">
          <AnswerButtons onAnswer={onAnswer} chosen={chosen} disabled={locked} />
        </footer>
      </main>

      <Sheet open={exitOpen} onClose={() => setExitOpen(false)} title={t("game.exit_title")}>
        <p className="text-body text-dust">{t("game.exit_body", { done: answered, n: round.total })}</p>
        <Button fullWidth onClick={() => setExitOpen(false)}>
          {t("game.exit_stay")}
        </Button>
        <Button variant="secondary" fullWidth onClick={onLeave}>
          {t("game.exit_leave")}
        </Button>
      </Sheet>
    </div>
  );
}
