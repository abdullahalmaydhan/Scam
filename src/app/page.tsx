import Link from "next/link";
import { BookOpen, Search } from "lucide-react";
import { HomeDecor } from "@/components/HomeDecor";
import { SiteHeader } from "@/components/SiteHeader";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ListItem } from "@/components/ui/ListItem";
import { MessageSlip } from "@/components/ui/MessageSlip";
import { localizeMessage } from "@/lib/game/localize";
import { getShowcase } from "@/lib/game/showcase";
import type { ShowcaseItem } from "@/lib/game/types";
import { getSessionUser } from "@/lib/auth.server";
import { getPrefs } from "@/lib/prefs.server";

/** H-1 home (guest). */
export default async function Home() {
  const [{ t, locale }, user] = await Promise.all([getPrefs(), getSessionUser()]);
  let showcase: ShowcaseItem[] = [];
  try {
    showcase = await getShowcase();
  } catch {
    // The examples are decoration; the page works without them.
  }
  const slips = showcase.map((s) => ({ ...localizeMessage(s, locale), s }));
  const tilt = ["-rotate-[1.2deg]", "rotate-[1deg] lg:me-8", "-rotate-[0.6deg]"];

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <HomeDecor />
      <SiteHeader t={t} current="game" user={user} />

      <main className="relative">
      <div className="relative mx-auto flex max-w-[1120px] flex-col gap-6 px-4 pt-4 pb-8 lg:flex-row lg:flex-wrap lg:items-center lg:gap-12 lg:px-6 lg:py-12">
        <section className="flex min-w-0 flex-col gap-4 lg:flex-[1_1_440px] lg:gap-6">
          <span className="text-caption text-dust">{t("home.eyebrow")}</span>
          <h1 className="text-display">{t("home.headline")}</h1>
          <p className="hidden max-w-[440px] text-body text-dust lg:block">{t("home.lead_laptop")}</p>

          {/* Phone: one example right above the CTA (HANDOFF decision 12). */}
          {slips[0] && (
            <MessageSlip
              className="lg:hidden"
              compact
              category={slips[0].s.category}
              sender={slips[0].sender}
              meta={slips[0].meta}
              body={slips[0].body}
              stamp={slips[0].s.correct_answer}
            />
          )}

          <ButtonLink href="/play" variant="hero" fullWidth className="mt-2 lg:mt-0 lg:w-auto lg:min-w-80 lg:self-start lg:px-12">
            {t("home.cta")}
          </ButtonLink>
        </section>

        {/* Laptop: the 3 examples (fraud, real, fraud). */}
        <section aria-label={t("home.showcase_label")} className="hidden min-w-0 flex-col gap-4 py-2 lg:flex lg:flex-[1_1_440px]">
          {slips.map((m, i) => (
            <MessageSlip
              key={i}
              compact
              stampAt="center"
              className={tilt[i]}
              category={m.s.category}
              sender={m.sender}
              meta={m.meta}
              body={m.body}
              stamp={m.s.correct_answer}
            />
          ))}
          <span className="text-caption text-dust">{t("home.showcase_note")}</span>
        </section>

        {/* Phone: other services as a list. */}
        <nav aria-label={t("home.other_services")} className="mt-2 flex flex-col gap-2 lg:hidden">
          <ListItem href="/scan" icon={<Search aria-hidden size={24} className="text-dust" />} title={t("home.scan_title")} sub={t("home.scan_sub")} />
          <ListItem href="/learn" icon={<BookOpen aria-hidden size={24} className="text-dust" />} title={t("home.learn_title")} sub={t("home.learn_sub")} />
        </nav>
      </div>

      {/* Laptop: other services as two cards. */}
      <section className="relative mx-auto hidden max-w-[1120px] flex-wrap gap-4 px-6 pb-12 lg:flex">
        {(
          [
            ["/scan", "home.scan_title", "home.scan_sub"],
            ["/learn", "home.learn_title", "home.learn_sub"],
          ] as const
        ).map(([href, title, sub]) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-16 flex-[1_1_320px] flex-col rounded-md bg-surface px-6 py-4 transition-colors hover:bg-line active:bg-line"
          >
            <span className="text-body font-bold">{t(title)}</span>
            <span className="text-caption text-dust">{t(sub)}</span>
          </Link>
        ))}
      </section>
      </main>
    </div>
  );
}
