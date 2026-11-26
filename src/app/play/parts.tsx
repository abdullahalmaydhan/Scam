"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useT } from "@/components/PrefsProvider";
import type { StringKey } from "@/lib/i18n";
import type { Difficulty, Mode } from "@/lib/game/types";

/** "الرسائل النصية SMS · سهل" */
export function useRoundLabel() {
  const t = useT();
  return (mode: Mode, difficulty: Difficulty) =>
    `${t(`game.categories.${mode}.title` as StringKey)} · ${t(`game.levels.${difficulty}.title` as StringKey)}`;
}

/** Back control: arrow pointing right in RTL (DESIGN.md §8). */
export function BackButton({ onClick, href, label }: { onClick?: () => void; href?: string; label: string }) {
  const cls =
    "flex size-11 shrink-0 items-center justify-center rounded-md text-paper transition-colors hover:bg-line active:bg-line";
  const icon = <ArrowRight aria-hidden size={24} className="ltr:rotate-180" />;
  return href ? (
    <Link href={href} aria-label={label} className={cls}>
      {icon}
    </Link>
  ) : (
    <button type="button" onClick={onClick} aria-label={label} className={cls}>
      {icon}
    </button>
  );
}

/** Laptop back link: arrow + "رجوع". */
export function BackLink({ onClick, href, label }: { onClick?: () => void; href?: string; label: string }) {
  const cls =
    "flex min-h-11 items-center gap-2 self-start rounded-md px-2 text-body text-dust transition-colors hover:bg-line active:bg-line";
  const inner = (
    <>
      <ArrowRight aria-hidden size={20} className="ltr:rotate-180" />
      {label}
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}
