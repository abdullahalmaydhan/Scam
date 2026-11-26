import type { Metadata } from "next";
import { getPrefs } from "@/lib/prefs.server";
import { ForgotForm } from "../clientForms";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPrefs();
  return { title: `${t("auth.forgot_title")} · ${t("brand")}` };
}

/** A-3 forgot password, then "link sent". */
export default function ForgotPage() {
  return <ForgotForm />;
}
