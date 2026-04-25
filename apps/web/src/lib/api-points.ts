import { cookies } from "next/headers";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";
import type {
  PointsBalance,
  PointsHistory,
} from "@/lib/api-points-types";

export type {
  PointsBalance,
  PointsHistory,
  PointsTxn,
  PointsTxnDirection,
} from "@/lib/api-points-types";
export { reasonLabel } from "@/lib/api-points-types";

function authHeaders(): HeadersInit | null {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

export async function getPointsBalance(): Promise<PointsBalance | null> {
  const headers = authHeaders();
  if (!headers) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/points/balance`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as PointsBalance;
  } catch {
    return null;
  }
}

export async function getPointsHistory(opts?: {
  limit?: number;
  cursor?: string;
}): Promise<PointsHistory> {
  const headers = authHeaders();
  if (!headers) return { rows: [], nextCursor: null };

  const url = new URL(`${API_BASE_URL}/points/history`);
  if (opts?.limit) url.searchParams.set("limit", String(opts.limit));
  if (opts?.cursor) url.searchParams.set("cursor", opts.cursor);

  try {
    const res = await fetch(url.toString(), {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return { rows: [], nextCursor: null };
    return (await res.json()) as PointsHistory;
  } catch {
    return { rows: [], nextCursor: null };
  }
}
