import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * C3 · Светлый card primitive.
 * 1px ink border, no radius, no shadow.
 * Composable with CardHeader / CardTitle / CardDescription / CardContent / CardFooter.
 */
export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-none border border-ink bg-paper text-ink", className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-1.5 px-5 pt-5 pb-3", className)}
      {...props}
    />
  ),
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-[22px] font-semibold leading-[1.05] tracking-[-0.02em]",
        className,
      )}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-[14px] leading-[1.5] text-graphite", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-5 py-3", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-3 px-5 pt-3 pb-5 border-t border-ink", className)}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";
