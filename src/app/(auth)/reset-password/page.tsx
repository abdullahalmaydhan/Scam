import type { Metadata } from "next";
import { getPrefs } from "@/lib/prefs.server";
import { ResetForm } from "../clientForms";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPrefs();
  return { title: `${t("auth.reset_title")} · ${t("brand")}` };
}

/**
 * A-4 reset password, opened from the email link (resetPasswordForEmail
 * redirectTo). HANDOFF [?]: not drawn, so it reuses the A-3 form with two
 * password fields.
 */
export default async function ResetPage({ searchParams }: PageProps<"/reset-password">) {
  const sp = await searchParams;
  return <ResetForm code={typeof sp.code === "string" ? sp.code : null} />;
}
