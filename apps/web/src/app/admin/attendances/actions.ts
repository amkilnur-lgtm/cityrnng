"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

type ActionResult = { ok: true } | { ok: false; message: string };

function authHeaders(): HeadersInit | null {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function approveAttendanceAction(
  id: string,
): Promise<ActionResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена." };
  try {
    const res = await fetch(
      `${API_BASE_URL}/admin/attendances/${id}/approve`,
      { method: "POST", headers },
    );
    if (!res.ok) {
      const p = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
      return { ok: false, message: p.message ?? p.code ?? `HTTP ${res.status}` };
    }
    revalidatePath("/admin/attendances");
    return { ok: true };
  } catch {
    return { ok: false, message: "API недоступен." };
  }
}

export async function rejectAttendanceAction(
  id: string,
  reason: string,
): Promise<ActionResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена." };
  try {
    const res = await fetch(`${API_BASE_URL}/admin/attendances/${id}/reject`, {
      method: "POST",
      headers,
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const p = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
      return { ok: false, message: p.message ?? p.code ?? `HTTP ${res.status}` };
    }
    revalidatePath("/admin/attendances");
    return { ok: true };
  } catch {
    return { ok: false, message: "API недоступен." };
  }
}
