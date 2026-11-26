import Link from "next/link";
import { Settings } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SessionUser } from "@/lib/auth.server";
import type { TFn } from "@/lib/i18n";

export type NavKey = "game" | "scan" | "learn";

const NAV: Array<{ key: NavKey; href: string }> = [
  { key: "game", href: "/play" },
  { key: "scan", href: "/scan" },
  { key: "learn", href: "/learn" },
];

/** First letter of the name for the avatar ("م" for محمد). */
function initial(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() ?? "";
}

/**
 * Site header. Laptop: brand (22) + nav + login and gear (guest) or
 * avatar + "حسابي" (signed in). Phone: the same without the nav.
 */
export function SiteHeader({
  t,
  current,
  user,
}: {
  t: TFn;
  current?: NavKey;
  user: SessionUser | null;
}) {
  return (
    <header className="relative mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-6 px-4 lg:h-auto lg:flex-wrap lg:justify-start lg:px-6 lg:py-4">
      <Link href="/" className="font-display text-body font-extrabold lg:text-title">
        {t("brand")}
      </Link>
      <nav aria-label={t("nav.sections")} className="hidden flex-1 flex-wrap gap-2 lg:flex">
        {NAV.map((n) => (
          <Link
            key={n.key}
            href={n.href}
            aria-current={current === n.key ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center rounded-md px-4 text-body transition-colors hover:bg-line active:bg-line",
              current === n.key ? "bg-surface font-bold text-paper" : "text-dust",
            )}
          >
            {t(`nav.${n.key}`)}
          </Link>
        ))}
      </nav>
      {user ? (
        // Signed in: avatar + "حسابي" (Settings is reached from inside حسابي, decision 27).
        <Link
          href="/profile"
          className="flex min-h-11 items-center gap-2 rounded-md border border-line ps-1.5 pe-4 text-caption font-semibold transition-colors hover:bg-line active:bg-surface lg:text-body"
        >
          <span
            aria-hidden
            className="flex size-8 items-center justify-center rounded-full bg-paper font-display text-body font-extrabold text-ink"
          >
            {initial(user.displayName)}
          </span>
          {t("nav.account")}
        </Link>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="flex min-h-11 items-center rounded-md border border-line px-4 text-caption font-semibold transition-colors hover:bg-line active:bg-surface lg:text-body"
          >
            {t("nav.login")}
          </Link>
          <Link
            href="/settings"
            aria-label={t("nav.settings")}
            className="flex size-11 items-center justify-center rounded-md border border-line transition-colors hover:bg-line active:bg-surface"
          >
            <Settings aria-hidden size={20} strokeWidth={1.8} />
          </Link>
        </div>
      )}
    </header>
  );
}
