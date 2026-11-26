"use client";

import Link from "next/link";
import { useT } from "@/components/PrefsProvider";
import { BackButton } from "@/app/play/parts";

/**
 * A-1…A-4 layout. Phone: back arrow, display title, fields, actions at the
 * bottom. Laptop: a centered 560 card (padding 48) under the site header.
 */
export function AuthShell({
  backHref,
  title,
  sub,
  onSubmit,
  children,
  actions,
}: {
  backHref: string;
  title: string;
  sub?: React.ReactNode;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
  actions: React.ReactNode;
}) {
  const t = useT();
  return (
    <div className="flex min-h-dvh flex-col lg:min-h-0 lg:px-6 lg:pt-6 lg:pb-16">
      <header className="flex h-16 items-center gap-2 px-2 lg:hidden">
        <BackButton href={backHref} label={t("nav.back")} />
      </header>
      <main className="flex flex-1 flex-col lg:flex-none">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.(e);
        }}
        className="flex flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-[560px] lg:flex-none lg:gap-6 lg:rounded-md lg:bg-surface lg:p-12"
      >
        <div className="flex flex-col gap-6 px-4 pt-2 lg:p-0">
          <div className="flex flex-col gap-2">
            <h1 className="text-display">{title}</h1>
            {sub && <div className="text-body text-dust">{sub}</div>}
          </div>
          {children}
        </div>
        <div className="mt-auto flex flex-col gap-2 px-4 pt-4 pb-8 lg:mt-0 lg:p-0">{actions}</div>
      </form>
      </main>
    </div>
  );
}

/** "ما عندك حساب؟ أنشئ حساب" style link. */
export function SwitchLink({ href, lead, cta }: { href: string; lead: string; cta: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-12 items-center justify-center gap-1 rounded-md text-body transition-colors hover:bg-line active:bg-line"
    >
      <span className="text-dust">{lead}</span>
      <b>{cta}</b>
    </Link>
  );
}
