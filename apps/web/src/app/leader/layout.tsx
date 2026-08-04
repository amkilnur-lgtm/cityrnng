import Link from "next/link";
import type { ReactNode } from "react";
import { Wrap } from "@/components/site/wrap";
import { requireLeader } from "@/lib/leader-guard";

export const metadata = { title: "Лидер · CITYRNNG" };

export default async function LeaderLayout({ children }: { children: ReactNode }) {
  const user = await requireLeader();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-ink">
        <Wrap className="flex items-center justify-between py-5">
          <Link
            href="/leader"
            className="font-mono text-[12px] font-medium uppercase tracking-[0.14em] text-ink"
          >
            CITYRNNG · лидер
          </Link>
          <span className="font-mono text-[12px] tracking-[0.04em] text-muted">
            {user.email}
          </span>
        </Wrap>
      </header>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
