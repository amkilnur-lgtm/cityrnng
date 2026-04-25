import { cookies } from "next/headers";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

export type PointsBalance = { balance: number };

export type PointsTxnDirection = "credit" | "debit";

export type PointsTxn = {
  id: string;
  direction: PointsTxnDirection;
  amount: number;
  balanceAfter: number;
  reasonType: string;
  reasonRef: string | null;
  comment: string | null;
  createdAt: string;
};

export type PointsHistory = {
  rows: PointsTxn[];
  nextCursor: string | null;
};

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

const REASON_LABELS: Record<string, string> = {
  signup_bonus: "Приветственный бонус",
  event_attendance_first: "Первая пробежка",
  event_attendance_regular: "Пробежка",
  event_attendance_special: "Спецсобытие",
  event_attendance_reversal: "Отмена начисления",
  manual_adjustment: "Ручная корректировка",
  reward_redemption: "Списание · обмен на reward",
};

export function reasonLabel(reasonType: string): string {
  return REASON_LABELS[reasonType] ?? reasonType;
}
