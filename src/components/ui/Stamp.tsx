"use client";

import { cn } from "@/lib/cn";
import { useT } from "@/components/PrefsProvider";
import type { Answer } from "./AnswerButtons";

/**
 * 96px stamp. Shows what the player chose, never whether it was right.
 * `animate` plays the print once; reduced motion just shows it.
 */
export function Stamp({ kind, animate, className }: { kind: Answer; animate?: boolean; className?: string }) {
  const t = useT();
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-24 items-center justify-center rounded-full border-3 bg-stamp-bg",
        "font-display text-body font-extrabold select-none",
        kind === "scam" ? "border-stamp text-stamp" : "border-stamp-safe text-stamp-safe",
        animate ? "motion-stamp animate-stamp" : "-rotate-12",
        className,
      )}
    >
      {t(kind === "scam" ? "game.answer_scam" : "game.answer_safe")}
    </span>
  );
}
