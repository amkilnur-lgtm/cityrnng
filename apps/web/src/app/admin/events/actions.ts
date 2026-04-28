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

/**
 * Build the request body from the form. Empty optional fields are dropped
 * so class-validator @IsOptional decorators see `undefined` (not `""`),
 * which matters for @IsDateString / @IsLatitude.
 */
function parseBodyFromForm(
  form: FormData,
  mode: "create" | "update",
): Record<string, unknown> {
  const str = (k: string) => {
    const v = form.get(k);
    if (v == null) return undefined;
    const s = String(v).trim();
    return s.length > 0 ? s : undefined;
  };
  const num = (k: string) => {
    const s = str(k);
    if (s == null) return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  };
  const datetime = (k: string) => {
    const s = str(k);
    if (s == null) return undefined;
    // <input type="datetime-local"> yields "YYYY-MM-DDTHH:MM" (no tz).
    // class-validator @IsDateString accepts ISO; append seconds + Z.
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) {
      return new Date(s).toISOString();
    }
    return s;
  };

  const body: Record<string, unknown> = {
    title: str("title"),
    slug: str("slug"),
    description: str("description"),
    type: str("type"),
    status: str("status"),
    startsAt: datetime("startsAt"),
    endsAt: datetime("endsAt"),
    locationName: str("locationName"),
    locationAddress: str("locationAddress"),
    locationLat: num("locationLat"),
    locationLng: num("locationLng"),
    capacity: num("capacity"),
    registrationOpenAt: datetime("registrationOpenAt"),
    registrationCloseAt: datetime("registrationCloseAt"),
    isPointsEligible: form.get("isPointsEligible") === "on",
    basePointsAward: num("basePointsAward"),
  };

  // On create the API requires title/slug/startsAt/endsAt — keep them even
  // if blank so the server returns a clean validation error, not a confusing
  // "Bad Request: missing field". On update we drop everything blank so
  // PATCH stays partial.
  if (mode === "update") {
    for (const k of Object.keys(body)) {
      if (body[k] === undefined) delete body[k];
    }
  }
  return body;
}

export async function createEventAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена. Войди как админ." };

  const body = parseBodyFromForm(formData, "create");
  if (!body.title || !body.slug || !body.startsAt || !body.endsAt) {
    return {
      ok: false,
      message: "Название, slug, время старта и окончания обязательны.",
    };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/admin/events`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as {
        message?: string | string[];
        code?: string;
      };
      const msg = Array.isArray(payload.message)
        ? payload.message.join("; ")
        : payload.message;
      return {
        ok: false,
        message: msg ?? payload.code ?? `HTTP ${res.status}`,
      };
    }
    revalidatePath("/admin/events");
  } catch {
    return { ok: false, message: "API недоступен." };
  }
  redirect("/admin/events");
}

export async function updateEventAction(
  id: string,
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена." };

  const body = parseBodyFromForm(formData, "update");

  try {
    const res = await fetch(`${API_BASE_URL}/admin/events/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as {
        message?: string | string[];
        code?: string;
      };
      const msg = Array.isArray(payload.message)
        ? payload.message.join("; ")
        : payload.message;
      return {
        ok: false,
        message: msg ?? payload.code ?? `HTTP ${res.status}`,
      };
    }
    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${id}`);
  } catch {
    return { ok: false, message: "API недоступен." };
  }
  redirect("/admin/events");
}
