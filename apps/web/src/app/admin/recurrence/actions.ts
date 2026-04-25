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
  const day = form.get("dayOfWeek");
  const dur = form.get("durationMinutes");
  const points = form.get("basePointsAward");
  return {
    title: String(form.get("title") ?? "").trim(),
    type: (form.get("type") ?? "regular") as
      | "regular"
      | "special"
      | "partner",
    status: (form.get("status") ?? "active") as "active" | "paused",
    dayOfWeek: day !== null ? Number(day) : 3,
    timeOfDay: String(form.get("timeOfDay") ?? "").trim(),
    durationMinutes: dur ? Number(dur) : 90,
    isPointsEligible: form.get("isPointsEligible") === "on",
    basePointsAward: points ? Number(points) : 0,
    startsFromDate: String(form.get("startsFromDate") ?? "").trim(),
    endsAtDate: form.get("endsAtDate")
      ? String(form.get("endsAtDate")).trim()
      : undefined,
    locationIds: form.getAll("locationIds").map(String).filter(Boolean),
  };
}

export async function createRecurrenceAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена." };
  const body = parseBody(formData);
  if (!body.title || !body.timeOfDay || !body.startsFromDate) {
    return { ok: false, message: "Title, time, and startsFromDate are required." };
  }
  if (body.locationIds.length === 0) {
    return { ok: false, message: "Выбери хотя бы одну локацию." };
  }
  try {
    const res = await fetch(`${API_BASE_URL}/admin/recurrence-rules`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const p = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
      return { ok: false, message: p.message ?? p.code ?? `HTTP ${res.status}` };
    }
    revalidatePath("/admin/recurrence");
  } catch {
    return { ok: false, message: "API недоступен." };
  }
  redirect("/admin/recurrence");
}

export async function updateRecurrenceAction(
  id: string,
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена." };
  const body = parseBody(formData);
  try {
    const res = await fetch(`${API_BASE_URL}/admin/recurrence-rules/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const p = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
      return { ok: false, message: p.message ?? p.code ?? `HTTP ${res.status}` };
    }
    revalidatePath("/admin/recurrence");
    revalidatePath(`/admin/recurrence/${id}`);
  } catch {
    return { ok: false, message: "API недоступен." };
  }
  redirect("/admin/recurrence");
}
