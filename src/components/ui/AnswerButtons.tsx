"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/components/PrefsProvider";

export type Answer = "scam" | "safe";

/**
 * The احتيال / حقيقية pair. Same look on phone and laptop (HANDOFF 15).
 * `chosen` keeps the tapped button filled while the stamp prints.
 */
export function AnswerButtons({
  onAnswer,
  chosen,
  disabled,
}: {
  onAnswer: (a: Answer) => void;
  chosen?: Answer | null;
  disabled?: boolean;
}) {
  const t = useT();
  const common =
    "inline-flex h-16 items-center justify-center gap-2 rounded-md border-2 font-display font-extrabold text-body " +
    "select-none transition-[background-color,transform] duration-100 active:scale-[.98] " +
    "disabled:cursor-not-allowed disabled:active:scale-100";

  const scamOn = chosen === "scam";
  const safeOn = chosen === "safe";
  const locked = disabled || !!chosen;

  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        disabled={locked}
        aria-pressed={scamOn}
        onClick={() => onAnswer("scam")}
        className={cn(
          common,
          scamOn
            ? "border-alert bg-alert text-ink"
            : disabled
              ? "border-line text-dust"
              : "border-alert bg-alert/8 text-alert active:bg-alert active:text-ink",
        )}
      >
        <X aria-hidden size={22} strokeWidth={2.5} />
        {t("game.answer_scam")}
      </button>
      <button
        type="button"
        disabled={locked}
        aria-pressed={safeOn}
        onClick={() => onAnswer("safe")}
        className={cn(
          common,
          safeOn
            ? "border-safe bg-safe text-ink"
            : disabled
              ? "border-line text-dust"
              : "border-safe bg-safe/8 text-safe active:bg-safe active:text-ink",
        )}
      >
        <Check aria-hidden size={22} strokeWidth={2.5} />
        {t("game.answer_safe")}
      </button>
    </div>
  );
}
