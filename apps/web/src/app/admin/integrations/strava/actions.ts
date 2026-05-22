"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

function authHeaders(): HeadersInit | null {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Register (or re-register) the Strava push subscription. The API service
 * itself is idempotent — if a stale subscription with a different callback
 * exists, it's replaced; if one with the right callback already exists,
 * it's returned as-is.
 */
export async function ensureStravaSubscriptionAction(): Promise<void> {
  const headers = authHeaders();
  if (!headers) return;
  await fetch(`${API_BASE_URL}/admin/integrations/strava/subscription`, {
    method: "POST",
    headers,
    cache: "no-store",
  });
  revalidatePath("/admin/integrations/strava");
}

export async function removeStravaSubscriptionAction(): Promise<void> {
  const headers = authHeaders();
  if (!headers) return;
  await fetch(`${API_BASE_URL}/admin/integrations/strava/subscription`, {
    method: "DELETE",
    headers,
    cache: "no-store",
  });
  revalidatePath("/admin/integrations/strava");
}
