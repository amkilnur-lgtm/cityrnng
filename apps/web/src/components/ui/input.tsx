import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * C3 · Светлый input primitive.
 * 1px ink border, red focus ring with tint outline.
 */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-none border border-ink bg-paper px-3 py-2 text-[15px] text-ink",
        "placeholder:text-muted",
        "focus:outline-none c3-focus focus:border-brand-red focus:outline focus:outline-2 focus:outline-brand-tint",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-[13px] file:font-medium",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
