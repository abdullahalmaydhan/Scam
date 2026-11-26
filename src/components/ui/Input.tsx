"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null;
  /** Extra content under the field (e.g. a "forgot password" link). */
  footer?: React.ReactNode;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, footer, className, id, dir, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-caption font-semibold text-paper">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        dir={dir}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "h-13 w-full rounded-md bg-surface px-4 text-body text-paper outline-none placeholder:text-dust",
          error
            ? "border-2 border-alert"
            : "border border-line focus:border-2 focus:border-paper focus:px-[15px]",
          error && "px-[15px]",
          className,
        )}
        {...rest}
      />
      {error && (
        <p id={errorId} role="alert" className="text-caption text-alert">
          {error}
        </p>
      )}
      {footer}
    </div>
  );
});
