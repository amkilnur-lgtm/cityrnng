"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";
import { disconnectStrava, getStravaAuthorizeUrl } from "@/lib/api-strava";

type ProfileResult =
  | { ok: true }
  | { ok: false; message: string };

export async function startStravaConnect(): Promise<
  { ok: true; url: string } | { ok: false; message: string }
> {
  const url = await getStravaAuthorizeUrl();
  if (!url) {
    return { ok: false, message: "Не получилось начать подключение Strava." };
  }
  return { ok: true, url };
}

export async function disconnectStravaAction(): Promise<{ ok: boolean }> {
  const ok = await disconnectStrava();
  if (ok) revalidatePath("/app/profile");
  return { ok };
}

/**
 * Pull the editable profile fields out of the form. Strings are passed
 * through as-is; the API trims and applies blank-as-null itself, so the
 * server is the single source of truth for that rule.
 */
function profileBodyFromForm(form: FormData): Record<string, unknown> {
  const get = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v : undefined;
  };
  return {
    displayName: get("displayName"),
    firstName: get("firstName"),
    lastName: get("lastName"),
    city: get("city"),
    telegramHandle: get("telegramHandle"),
    instagramHandle: get("instagramHandle"),
  };
}

export async function updateProfileAction(
  _prev: ProfileResult | undefined,
  formData: FormData,
): Promise<ProfileResult> {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return { ok: false, message: "Войди заново — нет access-токена." };

  const body = profileBodyFromForm(formData);
  if (typeof body.displayName === "string" && body.displayName.trim().length === 0) {
    return { ok: false, message: "Имя для отображения не может быть пустым." };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/me`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
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
    revalidatePath("/app/profile");
    revalidatePath("/app");
    return { ok: true };
  } catch {
    return { ok: false, message: "API недоступен." };
  }
}
