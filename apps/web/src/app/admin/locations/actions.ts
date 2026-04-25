"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string };

function authHeaders(): HeadersInit | null {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function parseBodyFromForm(form: FormData) {
  const lat = form.get("lat");
  const lng = form.get("lng");
  const radius = form.get("radiusMeters");
  return {
    slug: String(form.get("slug") ?? "").trim(),
    name: String(form.get("name") ?? "").trim(),
    city: String(form.get("city") ?? "").trim(),
    lat: lat ? Number(lat) : undefined,
    lng: lng ? Number(lng) : undefined,
    radiusMeters: radius ? Number(radius) : undefined,
    status: (form.get("status") ?? "active") as "active" | "archived",
  };
}

export async function createLocationAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена. Войди как админ." };

  const body = parseBodyFromForm(formData);
  if (!body.slug || !body.name || !body.city) {
    return { ok: false, message: "Slug, имя и город обязательны." };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/admin/locations`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as {
        message?: string;
        code?: string;
      };
      return {
        ok: false,
        message: payload.message ?? payload.code ?? `HTTP ${res.status}`,
      };
    }
    revalidatePath("/admin/locations");
  } catch {
    return { ok: false, message: "API недоступен." };
  }
  redirect("/admin/locations");
}

export async function updateLocationAction(
  id: string,
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена." };

  const body = parseBodyFromForm(formData);

  try {
    const res = await fetch(`${API_BASE_URL}/admin/locations/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as {
        message?: string;
        code?: string;
      };
      return {
        ok: false,
        message: payload.message ?? payload.code ?? `HTTP ${res.status}`,
      };
    }
    revalidatePath("/admin/locations");
    revalidatePath(`/admin/locations/${id}`);
  } catch {
    return { ok: false, message: "API недоступен." };
  }
  redirect("/admin/locations");
}
