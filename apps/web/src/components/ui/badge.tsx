import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * C3 · Светлый badge / tag primitive.
 * Mono uppercase, 1px border, no radius.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 px-2 py-[3px] rounded-none border text-[11px] font-mono font-medium uppercase tracking-[0.12em] whitespace-nowrap",
  {
    variants: {
      variant: {
        /** Default: paper + ink border. */
        default: "bg-paper text-ink border-ink",
        /** Filled red — "new", "accent" state. */
        primary: "bg-brand-red text-paper border-brand-red",
        /** Filled ink — neutral strong. */
        ink: "bg-ink text-paper border-ink",
        /** Soft: red text on red tint. */
        soft: "bg-brand-tint text-brand-red-ink border-brand-red",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
