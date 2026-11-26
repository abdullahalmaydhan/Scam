"use client";

import { cn } from "@/lib/cn";
import { usePrefs } from "@/components/PrefsProvider";

/** 152px (184 laptop) ring, rotated −8°, safe border when perfect. */
export function ScoreRing({ correct, total }: { correct: number; total: number }) {
  const { t, n } = usePrefs();
  const perfect = total > 0 && correct === total;
  return (
    <div
      className={cn(
        "flex size-38 shrink-0 -rotate-8 flex-col items-center justify-center rounded-full border-3 lg:size-46",
        perfect ? "border-safe" : "border-paper",
      )}
    >
      <span className="font-display text-display font-extrabold text-paper">{n(correct)}</span>
      <span className="text-caption text-dust">{t("result.ring_of", { n: total })}</span>
    </div>
  );
}
