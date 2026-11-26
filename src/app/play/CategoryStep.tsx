"use client";

import { usePrefs } from "@/components/PrefsProvider";
import { Button, RadioGroup, RadioOption } from "@/components/ui";
import { MODES, roundSize, type Mode } from "@/lib/game/types";
import { BackButton, BackLink } from "./parts";

/** G-1: choose the kind of messages. SMS is preselected. */
export function CategoryStep({
  mode,
  onChange,
  onNext,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
  onNext: () => void;
}) {
  const { t } = usePrefs();
  return (
    <div className="flex min-h-dvh flex-col lg:min-h-0">
      <header className="flex h-16 items-center gap-2 px-2 lg:hidden">
        <BackButton href="/" label={t("nav.back")} />
        <span className="flex-1" />
        <span className="px-2 text-caption text-dust">{t("game.step1")}</span>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-4 pt-2 lg:mx-auto lg:w-full lg:max-w-[880px] lg:gap-8 lg:px-6 lg:pt-6 lg:pb-16">
        <div className="hidden lg:flex">
          <BackLink href="/" label={t("nav.back")} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="hidden text-caption text-dust lg:block">{t("game.step1")}</span>
          <h1 className="text-title">{t("game.category_title")}</h1>
        </div>

        <RadioGroup label={t("game.category_title")} className="lg:grid lg:grid-cols-2 lg:gap-4">
          {MODES.map((m) => (
            <RadioOption
              key={m}
              name="mode"
              value={m}
              checked={mode === m}
              onChange={(v) => onChange(v as Mode)}
              title={t(`game.categories.${m}.title`)}
              sub={`${t(`game.categories.${m}.sub`)} · ${t("game.questions_count", { n: roundSize(m) })}`}
            />
          ))}
        </RadioGroup>

        <footer className="mt-auto pt-4 pb-8 lg:mt-0 lg:p-0">
          <Button fullWidth className="lg:w-auto lg:min-w-60 lg:px-8" onClick={onNext}>
            {t("game.next_to_level")}
          </Button>
        </footer>
      </main>
    </div>
  );
}
