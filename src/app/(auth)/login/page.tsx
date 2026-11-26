import type { Metadata } from "next";
import { getPrefs } from "@/lib/prefs.server";
import { LoginForm } from "../clientForms";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPrefs();
  return { title: `${t("nav.login")} · ${t("brand")}` };
}

/** A-1 login. ?from=result shows the points message; ?next= is where to go after. */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/";
  return <LoginForm fromResult={sp.from === "result"} next={next} />;
}
