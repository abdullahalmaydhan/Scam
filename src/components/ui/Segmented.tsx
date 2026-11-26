"use client";

import { cn } from "@/lib/cn";

/** Segmented control: track surface p4 r8, option h44 r4, selected paper. */
export function Segmented<V extends string>({
  name,
  label,
  value,
  options,
  onChange,
}: {
  name: string;
  label: string;
  value: V;
  options: ReadonlyArray<{ value: V; label: React.ReactNode }>;
  onChange: (v: V) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-md bg-surface p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <label
            key={o.value}
            className={cn(
              "flex h-11 flex-1 cursor-pointer items-center justify-center rounded-sm px-3 text-body",
              "transition-colors duration-100 select-none",
              "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-paper",
              on ? "bg-paper font-bold text-ink" : "text-paper hover:bg-line active:bg-line",
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={on}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        );
      })}
    </div>
  );
}
