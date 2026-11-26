import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { getSessionUser } from "@/lib/auth.server";
import { getPrefs } from "@/lib/prefs.server";
import { GameLoader } from "./GameLoader";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPrefs();
  return { title: `${t("nav.game")} · ${t("brand")}` };
}

/** /play: the challenge (G-1 → G-5). The laptop shows the site header. */
export default async function PlayPage() {
  const [{ t }, user] = await Promise.all([getPrefs(), getSessionUser()]);
  return (
    <div className="min-h-dvh">
      <div className="hidden lg:block">
        <SiteHeader t={t} current="game" user={user} />
      </div>
      <GameLoader />
    </div>
  );
}
