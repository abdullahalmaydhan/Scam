import { cn } from "@/lib/cn";

/** Surface card: r8, padding 16 (24 on laptop). */
export function Card({
  className,
  children,
  as: Tag = "div",
  ...rest
}: React.HTMLAttributes<HTMLElement> & { as?: "div" | "section" | "article" | "li" }) {
  return (
    <Tag className={cn("rounded-md bg-surface p-4 lg:p-6", className)} {...rest}>
      {children}
    </Tag>
  );
}
