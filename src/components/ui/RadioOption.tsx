"use client";

import { cn } from "@/lib/cn";

/** Group wrapper. Native radios inside give arrow-key navigation for free. */
export function RadioGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex flex-col gap-2", className)}>
      {children}
    </div>
  );
}

/** List item + 20px ring. Selected: 2px paper border and a filled dot. */
export function RadioOption({
  name,
  value,
  checked,
  onChange,
  title,
  sub,
  side,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: React.ReactNode;
  sub?: React.ReactNode;
  /** Text on the end side (e.g. "١٠ نقاط / لكل سؤال"). */
  side?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex min-h-16 cursor-pointer items-center gap-4 rounded-md border-2 bg-surface px-[14px] py-3 text-paper",
        "transition-colors duration-100 hover:bg-line active:bg-line",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-paper",
        checked ? "border-paper" : "border-transparent",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
          checked ? "border-paper" : "border-dust",
        )}
      >
        {checked && <span className="size-2.5 rounded-full bg-paper" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-body font-bold">{title}</span>
        {sub && <span className="text-caption text-dust">{sub}</span>}
      </span>
      {side && <span className="shrink-0 text-end text-caption text-dust">{side}</span>}
    </label>
  );
}
