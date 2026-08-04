"use server";

import { cookies } from "next/headers";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

export type LeaderScanResult =
  | { ok: true; result: string; credited: boolean; message: string }
  | { ok: false; message: string };

export type LeaderRecentScan = {
  id: string;
  result: string;
  scannedAt: string;
  checkinCode: string;
  runnerName: string | null;
  byLeader: boolean;
};

function authHeaders(): HeadersInit | null {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

/** Run a manual scan: the leader supplies a location + a runner's code. */
export async function leaderScanAction(
  locationId: string,
  code: string,
): Promise<LeaderScanResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Сессия истекла — войди заново." };
  const trimmed = code.trim();
  if (!locationId) return { ok: false, message: "Выбери точку." };
  if (!trimmed) return { ok: false, message: "Пустой код." };
  try {
    const res = await fetch(`${API_BASE_URL}/leader/checkin`, {
      method: "POST",
      headers,
      body: JSON.stringify({ locationId, code: trimmed }),
    });
    if (res.status === 403) {
      return { ok: false, message: "Нет доступа лидера. Обнови страницу или войди заново." };
    }
    if (!res.ok) return { ok: false, message: `Ошибка (${res.status}).` };
    const data = (await res.json()) as {
      result: string;
      ok: boolean;
      message: string;
    };
    return { ok: true, result: data.result, credited: data.ok, message: data.message };
  } catch {
    return { ok: false, message: "Нет связи с сервером." };
  }
}

/** Recent scans at a location — refreshed after each scan. */
export async function leaderRecentAction(
  locationId: string,
): Promise<LeaderRecentScan[]> {
  const headers = authHeaders();
  if (!headers || !locationId) return [];
  try {
    const res = await fetch(
      `${API_BASE_URL}/leader/checkin/recent?locationId=${encodeURIComponent(locationId)}`,
      { headers, cache: "no-store" },
    );
    if (!res.ok) return [];
    return (await res.json()) as LeaderRecentScan[];
  } catch {
    return [];
  }
}
