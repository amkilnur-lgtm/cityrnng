import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * C3 · Светлый button primitive.
 * Sharp-edge HUD style: radius 0, 1px ink border, no shadow.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none font-semibold leading-none transition-colors focus-visible:outline-none c3-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        /** Filled brand red — primary CTA. */
        primary:
          "bg-brand-red text-paper border border-brand-red hover:bg-brand-red-ink hover:border-brand-red-ink",
        /** Filled ink — secondary CTA. */
        ink: "bg-ink text-paper border border-ink hover:bg-graphite hover:border-graphite",
        /** Outlined ink — neutral tertiary action. */
        outline:
          "bg-paper text-ink border border-ink hover:bg-ink hover:text-paper",
        /** Transparent — minimal inline action. */
        ghost: "bg-transparent text-ink border border-transparent hover:bg-ink/5",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-11 px-5 text-[14px]",
        lg: "h-14 px-7 text-[15px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
