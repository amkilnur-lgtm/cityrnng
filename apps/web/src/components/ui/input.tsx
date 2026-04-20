import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-md border border-line bg-paper px-3 text-body text-ink placeholder:text-muted",
        "transition-colors focus-visible:outline-none focus-visible:border-ink",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-brand-red",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
