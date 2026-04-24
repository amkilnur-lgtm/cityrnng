import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Wrap({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1280px] px-6 lg:px-12", className)}
      {...props}
    >
      {children}
    </div>
  );
}
