"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

type Result = { ok: true } | { ok: false; message: string };

function authHeaders(): HeadersInit | null {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * eventKey may arrive as either the clean form `rule:UUID:DATE` (from /app's
 * getNextEventRsvp → MaterializedApiEvent.id) or already percent-encoded by
 * Next router params on a future caller. Decode-then-encode normalises both
 * into a single pass — same defensive pattern as getPublicEvent.
 */
function safeEventKey(eventKey: string): string {
  return encodeURIComponent(decodeURIComponent(eventKey));
}

export async function markGoingAction(
  eventKey: string,
  locationId: string,
): Promise<Result> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Войди, чтобы записаться." };
  try {
    const res = await fetch(
      `${API_BASE_URL}/events/${safeEventKey(eventKey)}/interest`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ locationId }),
      },
    );
    if (!res.ok) {
      const p = (await res.json().catch(() => ({}))) as {
        message?: string;
        code?: string;
      };
      return {
        ok: false,
        message: p.message ?? p.code ?? `HTTP ${res.status}`,
      };
    }
    revalidatePath(`/events/${eventKey}`);
    revalidatePath("/events");
    revalidatePath("/app");
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, message: "Не получилось связаться с сервером." };
  }
}

export async function cancelGoingAction(eventKey: string): Promise<Result> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Войди, чтобы изменить." };
  try {
    const res = await fetch(
      `${API_BASE_URL}/events/${safeEventKey(eventKey)}/interest`,
      { method: "DELETE", headers },
    );
    if (!res.ok) {
      return { ok: false, message: `HTTP ${res.status}` };
    }
    revalidatePath(`/events/${eventKey}`);
    revalidatePath("/events");
    revalidatePath("/app");
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, message: "Не получилось связаться с сервером." };
  }
}
