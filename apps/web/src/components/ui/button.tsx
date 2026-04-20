import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-50 active:translate-y-[1px]",
  {
    variants: {
      variant: {
        /** Brand-loud default — red, ink shadow, marker-drawn vibe */
        primary:
          "bg-brand-red text-paper shadow-[2px_2px_0_0_hsl(var(--ink))] hover:bg-brand-red-ink hover:shadow-[3px_3px_0_0_hsl(var(--ink))] hover:-translate-y-[1px]",
        /** Inverted — ink fill, for secondary CTAs on red/light bg */
        ink:
          "bg-ink text-paper hover:bg-ink/85",
        /** Outlined — marker-style border, paper fill */
        outline:
          "bg-paper text-ink border-2 border-ink shadow-[2px_2px_0_0_hsl(var(--ink))] hover:bg-ink hover:text-paper hover:shadow-[3px_3px_0_0_hsl(var(--brand-red))] hover:-translate-y-[1px]",
        ghost: "bg-transparent text-ink hover:bg-ink/5",
        link: "bg-transparent text-ink underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-9 px-4 text-small",
        md: "h-11 px-6 text-body",
        lg: "h-12 px-8 text-body",
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
