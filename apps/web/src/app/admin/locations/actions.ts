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

// -- Pace groups (per location) --

type PaceActionResult = { ok: true } | { ok: false; message: string };

export async function addPaceGroupAction(
  locationId: string,
  _prev: PaceActionResult | undefined,
  formData: FormData,
): Promise<PaceActionResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена." };

  const distanceKm = Number(formData.get("distanceKm"));
  // Pace input as "M:SS" — convert to integer seconds.
  const paceStr = String(formData.get("pace") ?? "").trim();
  const match = paceStr.match(/^(\d+):(\d{2})$/);
  if (!match) {
    return { ok: false, message: "Темп в формате M:SS, например 5:30" };
  }
  const paceSecondsPerKm = Number(match[1]) * 60 + Number(match[2]);
  const pacerName = String(formData.get("pacerName") ?? "").trim() || undefined;

  if (!Number.isFinite(distanceKm) || distanceKm < 1) {
    return { ok: false, message: "Дистанция должна быть положительным числом." };
  }

  try {
    const res = await fetch(
      `${API_BASE_URL}/admin/locations/${locationId}/pace-groups`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ distanceKm, paceSecondsPerKm, pacerName }),
      },
    );
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as {
        message?: string;
        code?: string;
      };
      const code = payload.code ?? "";
      if (code === "PACE_GROUP_DUPLICATE") {
        return { ok: false, message: "Такая комбинация (дистанция + темп) уже добавлена." };
      }
      return {
        ok: false,
        message: payload.message ?? code ?? `HTTP ${res.status}`,
      };
    }
    revalidatePath(`/admin/locations/${locationId}`);
    return { ok: true };
  } catch {
    return { ok: false, message: "API недоступен." };
  }
}

export async function deletePaceGroupAction(
  locationId: string,
  paceGroupId: string,
): Promise<PaceActionResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена." };

  try {
    const res = await fetch(
      `${API_BASE_URL}/admin/locations/${locationId}/pace-groups/${paceGroupId}`,
      { method: "DELETE", headers },
    );
    if (!res.ok) {
      return { ok: false, message: `HTTP ${res.status}` };
    }
    revalidatePath(`/admin/locations/${locationId}`);
    return { ok: true };
  } catch {
    return { ok: false, message: "API недоступен." };
  }
}
