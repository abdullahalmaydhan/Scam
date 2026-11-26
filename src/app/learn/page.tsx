import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { ListItem } from "@/components/ui/ListItem";
import { BackButton } from "@/app/play/parts";
import { getArticles } from "@/lib/articles.server";
import { getSessionUser } from "@/lib/auth.server";
import { getPrefs } from "@/lib/prefs.server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPrefs();
  return { title: `${t("learn.title")} · ${t("brand")}` };
}

/** L-1: the 8 topics, all the same size, nothing highlighted (HANDOFF 17). */
export default async function LearnPage() {
  const [{ t, locale }, user, articles] = await Promise.all([getPrefs(), getSessionUser(), getArticles()]);
  return (
    <div className="min-h-dvh">
      <div className="hidden lg:block">
        <SiteHeader t={t} current="learn" user={user} />
      </div>
      <header className="flex h-16 items-center gap-2 px-2 lg:hidden">
        <BackButton href="/" label={t("nav.back")} />
        <span className="text-caption text-dust">{t("learn.title")}</span>
      </header>
      <main className="mx-auto flex max-w-[720px] flex-col gap-6 px-4 pt-2 pb-8 lg:px-6 lg:pt-6 lg:pb-16">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-title lg:text-display">{t("learn.title")}</h1>
          <span className="text-caption text-dust lg:text-body">{t("learn.sub")}</span>
        </div>
        <nav aria-label={t("learn.all")} className="flex flex-col gap-2">
          {articles.map((a) => (
            <ListItem
              key={a.slug}
              href={`/learn/${a.slug}`}
              title={locale === "en" ? a.title_en ?? a.title_ar : a.title_ar}
              end={<span className="text-caption whitespace-nowrap text-dust">{t("learn.minutes", { n: a.minutes })}</span>}
              className="lg:px-6"
            />
          ))}
        </nav>
      </main>
    </div>
  );
}
