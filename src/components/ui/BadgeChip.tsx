"use client";

import { Award } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/components/PrefsProvider";

/** Earned: paper fill. In progress: dashed dust border + "٤٠ من ٥٠". */
export function BadgeChip({
  name,
  earned,
  current,
  target,
}: {
  name: string;
  earned: boolean;
  current?: number;
  target?: number;
}) {
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-caption font-semibold",
        earned ? "bg-paper text-ink" : "border border-dashed border-dust text-dust",
      )}
    >
      <Award aria-hidden size={18} />
      <span>{name}</span>
      {!earned && current !== undefined && target !== undefined && (
        <span className="font-normal">· {t("game.progress", { i: current, n: target })}</span>
      )}
    </span>
  );
}
