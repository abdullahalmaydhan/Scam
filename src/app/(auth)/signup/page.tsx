import type { Metadata } from "next";
import { getPrefs } from "@/lib/prefs.server";
import { SignupForm } from "../clientForms";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPrefs();
  return { title: `${t("auth.signup_title")} · ${t("brand")}` };
}

/** A-2 sign up. ?from=result shows "أنشئ حسابي واحفظ {points} نقطة". */
export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const sp = await searchParams;
  return <SignupForm fromResult={sp.from === "result"} />;
}
