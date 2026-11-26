"use client";

import { OctagonAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/components/PrefsProvider";

export type Risk = "low" | "suspicious" | "high";

const LEVELS: Risk[] = ["low", "suspicious", "high"];

const color: Record<Risk, { bg: string; text: string }> = {
  low: { bg: "bg-safe", text: "text-safe" },
  suspicious: { bg: "bg-warn", text: "text-warn" },
  high: { bg: "bg-alert", text: "text-alert" },
};

const Icon: Record<Risk, typeof ShieldCheck> = {
  low: ShieldCheck,
  suspicious: TriangleAlert,
  high: OctagonAlert,
};

/**
 * 3 equal segments. "insufficient" is not a 4th segment: the meter is
 * replaced by a sentence in dust (HANDOFF decision 7).
 */
export function RiskMeter({ risk }: { risk: Risk | "insufficient" }) {
  const t = useT();
  if (risk === "insufficient") {
    return <p className="text-body text-dust">{t("scan.insufficient_title")}</p>;
  }
  const I = Icon[risk];
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-1" aria-hidden>
        {LEVELS.map((l) => (
          <span key={l} className={cn("h-2 rounded-sm", l === risk ? color[l].bg : "bg-line")} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1 text-caption">
        {LEVELS.map((l) => (
          <span
            key={l}
            className={cn(
              "flex items-center gap-1",
              l === risk ? cn(color[l].text, "font-semibold") : "text-dust",
            )}
          >
            {l === risk && <I aria-hidden size={16} />}
            {t(`scan.meter.${l}`)}
          </span>
        ))}
      </div>
      <p className="sr-only">{t(`scan.risk.${risk}`)}</p>
    </div>
  );
}
