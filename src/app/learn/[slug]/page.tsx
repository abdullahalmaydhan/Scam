import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Isolated } from "@/components/ui/MessageSlip";
import { BackButton } from "@/app/play/parts";
import { getArticle, getArticles, type Section } from "@/lib/articles.server";
import { getSessionUser } from "@/lib/auth.server";
import { formatNumber } from "@/lib/i18n";
import { getPrefs } from "@/lib/prefs.server";

export async function generateMetadata({ params }: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const [{ t, locale }, { slug }] = await Promise.all([getPrefs(), params]);
  const a = await getArticle(slug);
  const title = a ? (locale === "en" ? a.title_en ?? a.title_ar : a.title_ar) : t("learn.title");
  return { title: `${title} · ${t("brand")}` };
}

/**
 * L-2: one article. Lists are numbered in Arabic-Indic digits inside a
 * small tilted ring. It ends with the "next topic" card, or on the last
 * article "ارجع لكل المواضيع". No mention of the challenge (HANDOFF 18).
 */
export default async function ArticlePage({ params }: PageProps<"/learn/[slug]">) {
  const { slug } = await params;
  const [{ t, locale }, user, article, all] = await Promise.all([
    getPrefs(),
    getSessionUser(),
    getArticle(slug),
    getArticles(),
  ]);
  if (!article) notFound();

  const en = locale === "en";
  const title = en ? article.title_en ?? article.title_ar : article.title_ar;
  const intro = en ? article.intro_en ?? article.intro_ar : article.intro_ar;
  const sections: Section[] = en ? article.sections_en ?? article.sections : article.sections;
  const index = all.findIndex((a) => a.slug === article.slug);
  const next = index >= 0 ? all[index + 1] : undefined;

  const card =
    "mt-4 flex min-h-18 items-center gap-4 rounded-md border border-line bg-surface p-4 transition-colors hover:bg-line active:bg-line";
  const arrow = <ArrowLeft aria-hidden size={22} className="shrink-0 text-dust ltr:rotate-180" />;

  return (
    <div className="min-h-dvh">
      <div className="hidden lg:block">
        <SiteHeader t={t} current="learn" user={user} />
      </div>
      <header className="flex h-16 items-center gap-2 px-2 lg:hidden">
        <BackButton href="/learn" label={t("nav.back")} />
        <span className="text-caption text-dust">{t("learn.title")}</span>
      </header>

      <main>
      <article className="mx-auto flex max-w-[720px] flex-col gap-6 px-4 pt-2 pb-8 lg:px-6 lg:pt-6 lg:pb-16">
        <Link
          href="/learn"
          className="hidden min-h-11 items-center gap-2 self-start rounded-md px-2 text-body text-dust transition-colors hover:bg-line active:bg-line lg:flex"
        >
          <ArrowRight aria-hidden size={20} className="ltr:rotate-180" />
          {t("learn.all")}
        </Link>
        <span className="text-caption text-dust">
          {t("learn.minutes_long", { n: article.minutes, i: index + 1, total: all.length })}
        </span>
        <h1 className="text-display">{title}</h1>
        <p className="text-body leading-[1.8]">
          <Isolated text={intro} />
        </p>

        {sections.map((s, si) => (
          <section key={si} className="flex flex-col gap-4">
            <h2 className="mt-2 text-title">{s.heading}</h2>
            {s.kind === "list" && s.items ? (
              <ol className="flex flex-col gap-2">
                {s.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-4 rounded-md bg-surface p-4">
                    <span
                      aria-hidden
                      className="flex size-8 shrink-0 -rotate-8 items-center justify-center rounded-full border-2 border-alert font-display text-caption font-extrabold text-alert"
                    >
                      {formatNumber(i + 1, locale)}
                    </span>
                    <span className="text-body">
                      <Isolated text={item} />
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-body leading-[1.8]">
                <Isolated text={s.text ?? ""} />
              </p>
            )}
          </section>
        ))}

        {next ? (
          <Link href={`/learn/${next.slug}`} className={card}>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-caption text-dust">{t("learn.next_label")}</span>
              <span className="text-body font-bold">{en ? next.title_en ?? next.title_ar : next.title_ar}</span>
            </span>
            {arrow}
          </Link>
        ) : (
          <Link href="/learn" className={card}>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-caption text-dust">{t("learn.all")}</span>
              <span className="text-body font-bold">{t("learn.back_all")}</span>
            </span>
            {arrow}
          </Link>
        )}
      </article>
      </main>
    </div>
  );
}
