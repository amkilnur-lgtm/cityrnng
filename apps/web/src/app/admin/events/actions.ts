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
    distanceLabel: str("distanceLabel"),
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

/** Read all checked locationIds from form (multi-select checkbox group). */
function pickLocationIds(formData: FormData): string[] {
  return formData
    .getAll("locationIds")
    .map((v) => String(v))
    .filter((v) => v.length > 0);
}

/** Parse API error response into a human-readable message. */
async function readError(res: Response): Promise<string> {
  const payload = (await res.json().catch(() => ({}))) as {
    message?: string | string[];
    code?: string;
  };
  const msg = Array.isArray(payload.message)
    ? payload.message.join("; ")
    : payload.message;
  return msg ?? payload.code ?? `HTTP ${res.status}`;
}

/**
 * Sync the event's sync-rule with the picked CityLocation IDs. PUT replaces
 * the full attached set (locationIds=[] clears it). windowStartsAt/EndsAt are
 * placeholders required by the DTO — the matcher no longer reads them, it
 * computes from event.startsAt/endsAt ±30m directly.
 */
async function upsertSyncRuleLocations(
  eventId: string,
  locationIds: string[],
  startsAt: string,
  endsAt: string,
  headers: HeadersInit,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/admin/events/${eventId}/sync-rules`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          windowStartsAt: startsAt,
          windowEndsAt: endsAt,
          locationIds,
          autoApprove: true,
        }),
      },
    );
    if (!res.ok) return { ok: false, message: await readError(res) };
    return { ok: true };
  } catch {
    return { ok: false, message: "Не удалось привязать локации (API недоступен)." };
  }
}

export async function createEventAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена. Войди как админ." };

  const body = parseBodyFromForm(formData, "create");
  if (!body.title || !body.startsAt || !body.endsAt) {
    return {
      ok: false,
      message: "Название, время старта и окончания обязательны.",
    };
  }
  // Slug is server-derived from title when missing; don't ship empty string.
  if (!body.slug) delete body.slug;

  const locationIds = pickLocationIds(formData);

  let createdId: string;
  try {
    const res = await fetch(`${API_BASE_URL}/admin/events`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, message: await readError(res) };
    const created = (await res.json()) as { id: string };
    createdId = created.id;
    revalidatePath("/admin/events");
  } catch {
    return { ok: false, message: "API недоступен." };
  }

  // Sync-rule is optional — admin can save event without any locations and
  // attach them later. Empty list still calls PUT to keep state consistent.
  const syncRes = await upsertSyncRuleLocations(
    createdId,
    locationIds,
    body.startsAt as string,
    body.endsAt as string,
    headers,
  );
  if (!syncRes.ok) {
    return {
      ok: false,
      message: `Событие создано, но локации не привязались: ${syncRes.message}`,
    };
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
  const locationIds = pickLocationIds(formData);

  try {
    const res = await fetch(`${API_BASE_URL}/admin/events/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, message: await readError(res) };
    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${id}`);
  } catch {
    return { ok: false, message: "API недоступен." };
  }

  // Always sync the location attachments — gives admin a single Save action
  // that handles both event fields and start-point assignment.
  const startsAt =
    (body.startsAt as string | undefined) ??
    (formData.get("startsAt")
      ? new Date(String(formData.get("startsAt"))).toISOString()
      : "");
  const endsAt =
    (body.endsAt as string | undefined) ??
    (formData.get("endsAt")
      ? new Date(String(formData.get("endsAt"))).toISOString()
      : "");
  if (startsAt && endsAt) {
    const syncRes = await upsertSyncRuleLocations(
      id,
      locationIds,
      startsAt,
      endsAt,
      headers,
    );
    if (!syncRes.ok) {
      return {
        ok: false,
        message: `Поля события обновились, но локации не привязались: ${syncRes.message}`,
      };
    }
  }
  redirect("/admin/events");
}
