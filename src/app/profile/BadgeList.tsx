"use client";

import { useState } from "react";
import { usePrefs } from "@/components/PrefsProvider";
import { cn } from "@/lib/cn";
import type { BadgeRow } from "@/lib/profile.server";

/** How close an unearned badge with progress is (for ordering). */
const ratio = (b: BadgeRow) => (b.progress ? b.progress.current / b.progress.target : -1);

/**
 * Badge rows: earned first, then in progress ("٤٠ من ٥٠" + "باقي ١٠"),
 * closest first, then the rest. Three rows, then "كل الشارات" shows all.
 */
export function BadgeList({ badges }: { badges: BadgeRow[] }) {
  const { t, locale } = usePrefs();
  const [all, setAll] = useState(false);

  const earned = badges.filter((b) => b.earned_at);
  const going = badges
    .filter((b) => !b.earned_at && b.progress)
    .sort((a, b) => ratio(b) - ratio(a));
  const locked = badges.filter((b) => !b.earned_at && !b.progress);
  const ordered = [...earned, ...going, ...locked];
  const shown = all ? ordered : ordered.slice(0, 3);

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col rounded-md bg-surface">
        {shown.map((b, i) => {
          const isEarned = !!b.earned_at;
          const p = b.progress;
          // badges.json has no English description: show it in Arabic only.
          const sub = isEarned
            ? locale === "ar"
              ? b.description_ar
              : null
            : p
              ? t("game.progress", { i: p.current, n: p.target })
              : locale === "ar"
                ? b.description_ar
                : null;
          return (
            <li
              key={b.code}
              className={cn("flex min-h-16 items-center gap-4 px-4 py-2 lg:px-6", i > 0 && "border-t border-line")}
            >
              <span
                aria-hidden
                className={cn(
                  "size-10 shrink-0 rounded-full",
                  isEarned ? "bg-paper" : "border-2 border-dashed border-dust",
                )}
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-body font-bold">{locale === "en" ? b.name_en : b.name_ar}</span>
                {sub && <span className="text-caption text-dust">{sub}</span>}
              </span>
              {isEarned ? (
                <span className="text-caption font-bold">{t("profile.earned")}</span>
              ) : (
                p && (
                  <span className="text-caption text-dust">
                    {t("profile.remaining_to_badge", { n: Math.max(0, p.target - p.current) })}
                  </span>
                )
              )}
            </li>
          );
        })}
      </ul>
      {!all && ordered.length > 3 && (
        <button
          type="button"
          onClick={() => setAll(true)}
          className="flex min-h-11 items-center self-start rounded-md px-2 text-body font-semibold transition-colors hover:bg-line active:bg-line"
        >
          {t("profile.all_badges")}
        </button>
      )}
    </div>
  );
}
