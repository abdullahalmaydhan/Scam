import { SiteHeader } from "@/components/SiteHeader";
import { getSessionUser } from "@/lib/auth.server";
import { getPrefs } from "@/lib/prefs.server";

/** A-1…A-4: the laptop shows the site header above the form card. */
export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const [{ t }, user] = await Promise.all([getPrefs(), getSessionUser()]);
  return (
    <div className="min-h-dvh">
      <div className="hidden lg:block">
        <SiteHeader t={t} user={user} />
      </div>
      {children}
    </div>
  );
}
