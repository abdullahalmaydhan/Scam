import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonClass, type ButtonVariant } from "./buttonStyles";

/** A link that looks like a Button (same variants and pressed states). */
export function ButtonLink({
  href,
  variant = "primary",
  fullWidth,
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, fullWidth, className)}>
      <span>{children}</span>
      {variant === "hero" && <ArrowLeft aria-hidden size={24} strokeWidth={2.4} className="ltr:rotate-180" />}
    </Link>
  );
}
