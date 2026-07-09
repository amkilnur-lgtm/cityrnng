import { cookies } from "next/headers";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

/** Server-side client for the admin operating-console summary. */

export type DashboardSummary = {
  health: {
    scanners: {
      total: number;
      active: number;
      /** Devices that phoned home within the last 7 days. */
      seen7d: number;
      lastSeenAt: string | null;
    };
    lastScanAt: string | null;
    totalScans: number;
  };
  kpis: {
    totalUsers: number;
    newUsers7d: number;
    withCheckinCode: number;
    activeRunners7d: number;
    pointsInCirculation: number;
  };
  checkinFlow: {
    scans7d: number;
    matched7d: number;
    duplicates7d: number;
    noWindow7d: number;
    unknownCode7d: number;
    errors7d: number;
    attendances7dQr: number;
    attendances7dManual: number;
  };
  events: {
    next: SummaryEvent | null;
    lastPast: SummaryEvent | null;
  };
};

export type SummaryEvent = {
  id: string;
  title: string;
  type: string;
  startsAt: string;
  goingCount: number;
  attendedCount: number;
};

export type DashboardSummaryResult =
  | { ok: true; data: DashboardSummary }
  | { ok: false; status: number; message: string };

function authHeaders(): HeadersInit | null {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

export async function getDashboardSummary(): Promise<DashboardSummaryResult> {
  const headers = authHeaders();
  if (!headers) {
    return { ok: false, status: 0, message: "Нет токена в куке — войди заново как admin." };
  }
  try {
    const res = await fetch(`${API_BASE_URL}/admin/dashboard/summary`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
      return {
        ok: false,
        status: res.status,
        message: body.message ?? body.code ?? `HTTP ${res.status}`,
      };
    }
    return { ok: true, data: (await res.json()) as DashboardSummary };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      message: `Не достучались до API: ${(err as Error).message}`,
    };
  }
}
