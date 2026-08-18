"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

function parseBody(form: FormData) {
  const cost = form.get("costPoints");
  const cap = form.get("capacity");
  return {
    slug: String(form.get("slug") ?? "").trim(),
    partnerId: String(form.get("partnerId") ?? "").trim(),
    title: String(form.get("title") ?? "").trim(),
    description: form.get("description")
      ? String(form.get("description")).trim()
      : undefined,
    costPoints: cost ? Number(cost) : undefined,
    badge: form.get("badge") ? String(form.get("badge")).trim() : undefined,
    status: (form.get("status") ?? "active") as "active" | "archived",
    fulfillmentType: (form.get("fulfillmentType") ?? "verify") as
      | "verify"
      | "promo_pool",
    validFrom: form.get("validFrom")
      ? String(form.get("validFrom")).trim()
      : undefined,
    validUntil: form.get("validUntil")
      ? String(form.get("validUntil")).trim()
      : undefined,
    capacity: cap ? Number(cap) : undefined,
  };
}

export type PromoStats = { available: number; assigned: number; total: number };

export async function getPromoStatsAction(rewardId: string): Promise<PromoStats | null> {
  const headers = authHeaders();
  if (!headers) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/admin/rewards/${rewardId}/promo-codes`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as PromoStats;
  } catch {
    return null;
  }
}

export async function addPromoCodesAction(
  rewardId: string,
  text: string,
): Promise<
  | { ok: true; added: number; skipped: number; available: number; total: number }
  | { ok: false; message: string }
> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена." };
  if (!text.trim()) return { ok: false, message: "Вставь список промокодов." };
  try {
    const res = await fetch(`${API_BASE_URL}/admin/rewards/${rewardId}/promo-codes`, {
      method: "POST",
      headers,
      body: JSON.stringify({ text }),
    });
    const p = (await res.json().catch(() => ({}))) as {
      added?: number;
      skipped?: number;
      available?: number;
      total?: number;
      message?: string;
      code?: string;
    };
    if (!res.ok) return { ok: false, message: p.message ?? p.code ?? `HTTP ${res.status}` };
    revalidatePath(`/admin/rewards/${rewardId}`);
    return {
      ok: true,
      added: p.added ?? 0,
      skipped: p.skipped ?? 0,
      available: p.available ?? 0,
      total: p.total ?? 0,
    };
  } catch {
    return { ok: false, message: "API недоступен." };
  }
}

export async function createRewardAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена." };
  const body = parseBody(formData);
  if (!body.slug || !body.partnerId || !body.title || !body.costPoints) {
    return {
      ok: false,
      message: "Slug, партнёр, название и цена в баллах обязательны.",
    };
  }
  try {
    const res = await fetch(`${API_BASE_URL}/admin/rewards`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const p = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
      return { ok: false, message: p.message ?? p.code ?? `HTTP ${res.status}` };
    }
    revalidatePath("/admin/rewards");
  } catch {
    return { ok: false, message: "API недоступен." };
  }
  redirect("/admin/rewards");
}

export async function updateRewardAction(
  id: string,
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена." };
  const body = parseBody(formData);
  try {
    const res = await fetch(`${API_BASE_URL}/admin/rewards/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const p = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
      return { ok: false, message: p.message ?? p.code ?? `HTTP ${res.status}` };
    }
    revalidatePath("/admin/rewards");
    revalidatePath(`/admin/rewards/${id}`);
  } catch {
    return { ok: false, message: "API недоступен." };
  }
  redirect("/admin/rewards");
}
