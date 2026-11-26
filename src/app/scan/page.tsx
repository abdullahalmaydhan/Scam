import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { BackButton } from "@/app/play/parts";
import { getSessionUser } from "@/lib/auth.server";
import { getPrefs } from "@/lib/prefs.server";
import { scanLimit, scansLeft } from "@/lib/scanLimit.server";
import { ScanApp } from "./ScanApp";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPrefs();
  return { title: `${t("nav.scan")} · ${t("brand")}` };
}

/** S-1 / S-2. Guests see "الكاشف يحتاج حساب" instead of a redirect (HANDOFF §5). */
export default async function ScanPage() {
  const [{ t }, user] = await Promise.all([getPrefs(), getSessionUser()]);
  const remaining = user ? await scansLeft(user.id).catch(() => scanLimit()) : 0;

  return (
    <div className="min-h-dvh">
      <div className="hidden lg:block">
        <SiteHeader t={t} current="scan" user={user} />
      </div>
      {user ? (
        <ScanApp initialRemaining={remaining} limit={scanLimit()} />
      ) : (
        <div className="flex min-h-dvh flex-col lg:min-h-0">
          <header className="flex h-16 items-center gap-2 px-2 lg:hidden">
            <BackButton href="/" label={t("nav.back")} />
            <span className="text-caption text-dust">{t("nav.scan")}</span>
          </header>
          <main className="flex flex-1 flex-col">
          <div className="flex flex-col gap-4 px-6 pt-12 lg:mx-auto lg:w-full lg:max-w-[560px] lg:px-6 lg:pt-12">
            <Lock aria-hidden size={48} strokeWidth={1.8} />
            <h1 className="text-title">{t("scan.guest_title")}</h1>
            <p className="text-body">{t("scan.guest_body")}</p>
            <span className="text-caption text-dust">{t("scan.guest_note")}</span>
          </div>
          <div className="mt-auto flex flex-col gap-2 px-4 pt-4 pb-8 lg:mx-auto lg:mt-8 lg:w-full lg:max-w-[560px] lg:px-6">
            <ButtonLink href="/signup" fullWidth>
              {t("scan.guest_cta")}
            </ButtonLink>
            <ButtonLink href="/login?next=/scan" variant="secondary" fullWidth>
              {t("scan.guest_cta2")}
            </ButtonLink>
          </div>
          </main>
        </div>
      )}
    </div>
  );
}
