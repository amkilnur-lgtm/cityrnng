"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

function authHeaders(): HeadersInit | null {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function verifyRedemptionAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена." };
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!code) return { ok: false, message: "Введи код." };
  try {
    const res = await fetch(
      `${API_BASE_URL}/admin/redemptions/verify/${encodeURIComponent(code)}`,
      { method: "POST", headers },
    );
    if (!res.ok) {
      const p = (await res.json().catch(() => ({}))) as {
        message?: string;
        code?: string;
      };
      return { ok: false, message: p.message ?? p.code ?? `HTTP ${res.status}` };
    }
  } catch {
    return { ok: false, message: "API недоступен." };
  }
  revalidatePath("/admin/redemptions");
  return { ok: true, message: `Код ${code} погашен.` };
}

export async function cancelRedemptionAction(
  id: string,
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена." };
  const reason = String(formData.get("reason") ?? "").trim() || undefined;
  try {
    const res = await fetch(
      `${API_BASE_URL}/admin/redemptions/${id}/cancel`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ reason }),
      },
    );
    if (!res.ok) {
      const p = (await res.json().catch(() => ({}))) as {
        message?: string;
        code?: string;
      };
      return { ok: false, message: p.message ?? p.code ?? `HTTP ${res.status}` };
    }
  } catch {
    return { ok: false, message: "API недоступен." };
  }
  revalidatePath("/admin/redemptions");
  return { ok: true, message: "Отменён, баллы возвращены." };
}
