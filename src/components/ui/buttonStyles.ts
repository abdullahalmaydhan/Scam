import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "hero" | "secondary" | "destructive" | "destructive-confirm";

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-md px-6 select-none " +
  "transition-[background-color,transform] duration-100 active:scale-[.98] " +
  "disabled:cursor-not-allowed disabled:active:scale-100";

const variants: Record<ButtonVariant, string> = {
  primary:
    "h-14 bg-paper text-ink font-display font-extrabold text-body active:bg-paper-pressed " +
    "disabled:bg-line disabled:text-disabled-text",
  hero:
    "h-18 gap-4 bg-paper text-ink font-display font-extrabold text-title active:bg-paper-pressed " +
    "disabled:bg-line disabled:text-disabled-text",
  secondary:
    "h-12 border border-line text-paper font-body font-semibold text-body hover:bg-line active:bg-surface " +
    "disabled:text-dust",
  destructive:
    "h-12 border border-alert text-alert font-body font-semibold text-body hover:bg-line active:bg-surface",
  "destructive-confirm":
    "h-14 bg-alert text-ink font-display font-extrabold text-body active:opacity-90",
};

export function buttonClass(variant: ButtonVariant = "primary", fullWidth?: boolean, className?: string) {
  return cn(base, variants[variant], fullWidth && "w-full", className);
}
