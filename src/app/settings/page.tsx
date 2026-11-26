import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { BackButton } from "@/app/play/parts";
import { getPrefs } from "@/lib/prefs.server";
import { getProfile } from "@/lib/profile.server";
import { createClient } from "@/lib/supabase/server";
import { AccountSettings } from "./AccountSettings";
import { PrefsSection } from "./PrefsSection";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPrefs();
  return { title: `${t("settings.title")} · ${t("brand")}` };
}

/**
 * P-2 settings (signed in) or P-0 guest settings: language and appearance
 * only, plus a card asking to log in (HANDOFF decision 27).
 */
export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const [{ t }, profile] = await Promise.all([getPrefs(), user ? getProfile(supabase, user) : Promise.resolve(null)]);

  return (
    <div className="min-h-dvh">
      <div className="hidden lg:block">
        <SiteHeader t={t} user={user && profile ? { id: user.id, displayName: profile.display_name } : null} />
      </div>
      <header className="flex h-16 items-center gap-2 px-2 lg:hidden">
        <BackButton href={user ? "/profile" : "/"} label={t("nav.back")} />
        <span className="text-caption text-dust">{t("settings.title")}</span>
      </header>
      <main className="mx-auto flex max-w-[560px] flex-col gap-6 px-4 pt-2 pb-8 lg:px-6 lg:pt-6 lg:pb-16">
        <div className="hidden lg:block">
          <BackButton href={user ? "/profile" : "/"} label={t("nav.back")} />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-title">{t("settings.title")}</h1>
          <span className="text-caption text-dust">{t("settings.guest_note")}</span>
        </div>

        <PrefsSection signedIn={!!user} />

        {user && profile ? (
          <AccountSettings
            displayName={profile.display_name}
            email={profile.email}
            stats={{
              points: profile.stats.total_points,
              badges: profile.badges_earned,
              rounds: profile.stats.rounds_completed,
            }}
          />
        ) : (
          <section className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4">
            <p className="text-body">{t("settings.guest_login_body")}</p>
            <ButtonLink href="/login?next=/settings" variant="secondary" fullWidth className="border-paper font-bold">
              {t("settings.guest_login_cta")}
            </ButtonLink>
          </section>
        )}
      </main>
    </div>
  );
}
