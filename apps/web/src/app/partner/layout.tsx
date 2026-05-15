import Link from "next/link";
import type { ReactNode } from "react";
import { Wrap } from "@/components/site/wrap";
import { requirePartner } from "@/lib/partner-guard";

export const metadata = { title: "Партнёр · CITYRNNG" };

export default async function PartnerLayout({ children }: { children: ReactNode }) {
  const user = await requirePartner();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-ink">
        <Wrap className="flex items-center justify-between py-5">
          <Link
            href="/partner"
            className="font-mono text-[12px] font-medium uppercase tracking-[0.14em] text-ink"
          >
            CITYRNNG · partner
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
