import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopBar } from "@/components/admin/admin-topbar";
import { requireAdmin } from "@/lib/admin-guard";

export const metadata = { title: "Admin · CITYRNNG" };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const ctx = await requireAdmin();
  const isDev = ctx.kind === "dev";

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminTopBar isDev={isDev} />
      <AdminSidebar isDev={isDev} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
