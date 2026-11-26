import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";

type Common = {
  title: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  /** Content before the chevron (e.g. a count). */
  end?: React.ReactNode;
  className?: string;
};

const cls =
  "flex min-h-16 w-full items-center gap-4 rounded-md bg-surface px-4 py-3 text-start text-paper " +
  "transition-colors duration-100 hover:bg-line active:bg-line";

function Inner({ title, sub, icon, end }: Common) {
  return (
    <>
      {icon && <span className="shrink-0 text-paper">{icon}</span>}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-body font-bold">{title}</span>
        {sub && <span className="text-caption text-dust">{sub}</span>}
      </span>
      {end}
      <ChevronLeft aria-hidden size={20} className="shrink-0 text-dust ltr:rotate-180" />
    </>
  );
}

/** List item: a link (href) or a button (onClick). Chevron points forward. */
export function ListItem(
  props: Common & ({ href: string; onClick?: never } | { href?: never; onClick: () => void }),
) {
  if (props.href) {
    return (
      <Link href={props.href} className={cn(cls, props.className)}>
        <Inner {...props} />
      </Link>
    );
  }
  return (
    <button type="button" onClick={props.onClick} className={cn(cls, props.className)}>
      <Inner {...props} />
    </button>
  );
}
