import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { ProgressBar } from "@/components/ui";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { BackButton } from "@/app/play/parts";
import { formatMonthYear, formatNumber, formatPercent, type StringKey } from "@/lib/i18n";
import { getPrefs } from "@/lib/prefs.server";
import { getBadges, getHistory, getProfile } from "@/lib/profile.server";
import { createClient } from "@/lib/supabase/server";
import { BadgeList } from "./BadgeList";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPrefs();
  return { title: `${t("profile.title")} · ${t("brand")}` };
}

/** P-1 profile: points, stats, per-category bars, badges, history. */
export default async function ProfilePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/profile");
  const user = data.user;

  const [{ t, locale }, profile, badges, history] = await Promise.all([
    getPrefs(),
    getProfile(supabase, user),
    getBadges(supabase, user),
    getHistory(supabase, user, 10),
  ]);
  const n = (v: number) => formatNumber(v, locale);
  const pct = (v: number) => formatPercent(v, locale);
  const s = profile.stats;
  const empty = s.rounds_completed === 0;
  const initial = Array.from(profile.display_name.trim())[0]?.toUpperCase() ?? "";
  // Arabic plural: ٣–١٠ "أسئلة", otherwise "سؤال".
  const questions = (count: number) =>
    count >= 3 && count <= 10 ? t("game.questions_count", { n: count }) : `${n(count)} ${t("profile.questions")}`;
  const roundLabel = (mode: string, diff: string) =>
    `${t(`game.categories.${mode}.title` as StringKey)} · ${t(`game.levels.${diff}.title` as StringKey)}`;
  const categories = [...profile.categories].sort((a, b) => b.correct_percent - a.correct_percent);

  const identity = (
    <section className="flex items-center gap-4 lg:flex-wrap lg:gap-6">
      <span
        aria-hidden
        className="flex size-14 shrink-0 items-center justify-center rounded-full bg-paper font-display text-title font-extrabold text-ink lg:size-18"
      >
        {initial}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-body font-bold lg:font-display lg:text-title lg:font-extrabold">
          <bdi>{profile.display_name}</bdi>
        </span>
        <span className="text-caption text-dust">
          {t("profile.member_since", { month: formatMonthYear(profile.member_since, locale) })}
        </span>
      </span>
      <Link
        href="/settings"
        className="hidden min-h-11 items-center rounded-md border border-line px-4 text-body transition-colors hover:bg-line active:bg-surface lg:flex"
      >
        {t("nav.settings")}
      </Link>
    </section>
  );

  const total = (
    <section className="flex flex-col gap-1">
      <span className="text-caption text-dust">{t("profile.total_points")}</span>
      {/* Empty: dimmed like the board, but in dust (line fails 4.5:1 contrast). */}
      <span className={`font-display text-display font-extrabold ${empty ? "text-dust" : ""}`}>{n(s.total_points)}</span>
    </section>
  );

  return (
    <div className="min-h-dvh">
      <div className="hidden lg:block">
        <SiteHeader t={t} user={{ id: user.id, displayName: profile.display_name }} />
      </div>
      <header className="flex h-16 items-center gap-2 px-2 lg:hidden">
        <BackButton href="/" label={t("nav.back")} />
        <span className="flex-1 text-caption text-dust">{t("profile.title")}</span>
        <Link
          href="/settings"
          aria-label={t("nav.settings")}
          className="flex size-11 items-center justify-center rounded-md transition-colors hover:bg-line active:bg-line"
        >
          <Settings aria-hidden size={22} strokeWidth={1.8} />
        </Link>
      </header>

      {empty ? (
        // P-1 empty state (states/ProfileEmpty).
        <main className="flex min-h-[calc(100dvh-64px)] flex-col gap-6 px-4 pt-2 lg:mx-auto lg:min-h-0 lg:max-w-[720px] lg:px-6 lg:pt-6 lg:pb-16">
          {identity}
          {total}
          <div className="flex flex-col gap-2 rounded-md border border-dashed border-dust px-4 py-6">
            <h1 className="text-title">{t("profile.empty_title")}</h1>
            <p className="text-body text-dust">{t("profile.empty_body")}</p>
          </div>
          <div className="mt-auto pt-4 pb-8 lg:mt-0 lg:p-0">
            <ButtonLink href="/play" fullWidth className="lg:w-auto lg:min-w-60">
              {t("profile.empty_cta")}
            </ButtonLink>
          </div>
        </main>
      ) : (
        <main className="flex flex-col gap-6 px-4 pt-2 pb-8 lg:mx-auto lg:max-w-[1120px] lg:gap-8 lg:px-6 lg:pt-6 lg:pb-16">
          {identity}
          <div className="flex flex-col gap-6 lg:flex-row lg:flex-wrap lg:items-start lg:gap-12">
            <div className="flex min-w-0 flex-col gap-6 lg:flex-[1_1_480px]">
              {total}
              <div className="grid grid-cols-3 gap-2 lg:gap-4">
                {(
                  [
                    [pct(s.correct_percent), "profile.correct"],
                    [n(s.rounds_completed), "profile.rounds"],
                    [n(s.questions_answered), "profile.questions"],
                  ] as const
                ).map(([value, label]) => (
                  <div key={label} className="flex flex-col rounded-md bg-surface p-4 lg:px-6">
                    <span className="font-display text-title font-extrabold">{value}</span>
                    <span className="text-caption text-dust">{t(label)}</span>
                  </div>
                ))}
              </div>

              <section className="flex flex-col gap-4">
                <h2 className="text-title">{t("profile.per_category")}</h2>
                {categories.map((c) => {
                  const label = t(`game.categories.${c.category}.title` as StringKey);
                  return (
                    <div key={c.category} className="flex flex-col gap-2">
                      <div className="flex items-baseline gap-2 text-body">
                        <span className="flex-1">{label}</span>
                        <span className="text-caption text-dust">
                          {pct(c.correct_percent)} · {questions(c.answered)}
                        </span>
                      </div>
                      <ProgressBar value={c.correct_percent} max={100} label={label} />
                    </div>
                  );
                })}
              </section>
            </div>

            <div className="flex min-w-0 flex-col gap-6 lg:flex-[1_1_400px]">
              <section className="flex flex-col gap-2 lg:gap-4">
                <h2 className="text-title">
                  {t("profile.badges", { earned: profile.badges_earned, total: profile.badges_total })}
                </h2>
                <BadgeList badges={badges} />
              </section>

              <section className="flex flex-col">
                <h2 className="text-title">{t("profile.history")}</h2>
                <ul className="mt-2">
                  {history.map((h, i) => (
                    <li
                      key={`${h.completed_at}-${i}`}
                      className="flex min-h-13 items-center gap-2 border-b border-line text-body last:border-b-0"
                    >
                      <span className="flex-1">{roundLabel(h.mode, h.difficulty)}</span>
                      <span className="text-caption text-dust">
                        {t("game.progress", { i: h.correct, n: h.total })} ·{" "}
                        <bdi dir="ltr">+{n(h.points)}</bdi>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
