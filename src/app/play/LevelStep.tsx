"use client";

import { usePrefs } from "@/components/PrefsProvider";
import { Button, RadioGroup, RadioOption } from "@/components/ui";
import type { StringKey } from "@/lib/i18n";
import { DIFFICULTIES, POINTS, roundSize, type Difficulty, type Mode } from "@/lib/game/types";
import { BackButton, BackLink } from "./parts";

/** G-2: choose the difficulty. Easy is preselected. */
export function LevelStep({
  mode,
  difficulty,
  onChange,
  onBack,
  onStart,
  loading,
  error,
}: {
  mode: Mode;
  difficulty: Difficulty;
  onChange: (d: Difficulty) => void;
  onBack: () => void;
  onStart: () => void;
  loading: boolean;
  error: StringKey | null;
}) {
  const { t } = usePrefs();
  const n = roundSize(mode);
  return (
    <div className="flex min-h-dvh flex-col lg:min-h-0">
      <header className="flex h-16 items-center gap-2 px-2 lg:hidden">
        <BackButton onClick={onBack} label={t("nav.back")} />
        <span className="flex-1 text-caption text-dust">{t(`game.categories.${mode}.title`)}</span>
        <span className="px-2 text-caption text-dust">{t("game.step2")}</span>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-4 pt-2 lg:mx-auto lg:w-full lg:max-w-[880px] lg:gap-8 lg:px-6 lg:pt-6 lg:pb-16">
        <div className="hidden lg:flex">
          <BackLink onClick={onBack} label={t("nav.back")} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="hidden text-caption text-dust lg:block">
            {t(`game.categories.${mode}.title`)} · {t("game.step2")}
          </span>
          <h1 className="text-title">{t("game.level_title")}</h1>
        </div>

        <RadioGroup label={t("game.level_title")}>
          {DIFFICULTIES.map((d) => (
            <RadioOption
              key={d}
              name="difficulty"
              value={d}
              checked={difficulty === d}
              onChange={(v) => onChange(v as Difficulty)}
              title={t(`game.levels.${d}.title`)}
              sub={t(`game.levels.${d}.sub`)}
              side={
                <span className="flex flex-col items-end">
                  {/* Arabic: ١٠ نقاط, but ٢٠ / ٣٠ نقطة (HANDOFF decision 21). */}
                  <span className="text-body font-bold text-paper">
                    {t(POINTS[d] <= 10 ? "game.points_side" : "game.points_side_plural", { n: POINTS[d] })}
                  </span>
                  <span>{t("game.per_question")}</span>
                </span>
              }
            />
          ))}
        </RadioGroup>

        <p className="text-caption text-dust">{t("game.level_note")}</p>

        <footer className="mt-auto flex flex-col gap-2 pt-4 pb-8 lg:mt-0 lg:p-0">
          {error && (
            <p role="alert" className="text-caption text-alert">
              {t(error)}
            </p>
          )}
          <Button
            fullWidth
            className="lg:w-auto lg:min-w-60 lg:self-start lg:px-8"
            onClick={onStart}
            loading={loading}
            loadingText={t("game.loading", { n })}
          >
            {t("game.start", { n })}
          </Button>
        </footer>
      </main>
    </div>
  );
}
