"use client";

import { forwardRef } from "react";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { buttonClass, type ButtonVariant } from "./buttonStyles";

export type { ButtonVariant };

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** Shows the spinner and replaces the label with the verb in progress. */
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", loading, loadingText, icon, fullWidth, className, children, disabled, type, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, fullWidth, className)}
      {...rest}
    >
      {loading ? (
        <>
          <LoaderCircle aria-hidden size={18} className="animate-spin" />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        <>
          {icon}
          <span>{children}</span>
          {variant === "hero" && <ArrowLeft aria-hidden size={24} className="ltr:rotate-180" />}
        </>
      )}
    </button>
  );
});
