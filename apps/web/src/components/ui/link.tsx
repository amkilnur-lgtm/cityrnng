import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = NextLinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof NextLinkProps> & {
    children: ReactNode;
    className?: string;
  };

export function Link({ className, children, ...props }: Props) {
  return (
    <NextLink
      className={cn(
        "text-ink underline decoration-line decoration-1 underline-offset-4 transition-colors",
        "hover:decoration-ink",
        className,
      )}
      {...props}
    >
      {children}
    </NextLink>
  );
}
