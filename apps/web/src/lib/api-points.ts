import { API_BASE_URL } from "@/lib/api-config";
import { apiFetch } from "@/lib/api-fetch";
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

export async function getPointsBalance(): Promise<PointsBalance | null> {
  const res = await apiFetch(`${API_BASE_URL}/points/balance`);
  if (!res || !res.ok) return null;
  return (await res.json()) as PointsBalance;
}

export async function getPointsHistory(opts?: {
  limit?: number;
  cursor?: string;
}): Promise<PointsHistory> {
  const url = new URL(`${API_BASE_URL}/points/history`);
  if (opts?.limit) url.searchParams.set("limit", String(opts.limit));
  if (opts?.cursor) url.searchParams.set("cursor", opts.cursor);

  const res = await apiFetch(url.toString());
  if (!res || !res.ok) return { items: [], nextCursor: null };
  return (await res.json()) as PointsHistory;
}
