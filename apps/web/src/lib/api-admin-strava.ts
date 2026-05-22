import { cookies } from "next/headers";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

export type StravaSubscription = {
  id: number;
  resource_state: number;
  application_id: number;
  callback_url: string;
  created_at: string;
  updated_at: string;
};

export type StravaSubscriptionStatus = {
  callbackUrl: string;
  subscription: StravaSubscription | null;
};

function authHeaders(): HeadersInit | null {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

export async function getStravaSubscriptionStatus(): Promise<StravaSubscriptionStatus | null> {
  const headers = authHeaders();
  if (!headers) return null;
  try {
    const res = await fetch(
      `${API_BASE_URL}/admin/integrations/strava/subscription`,
      {
        headers,
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    return (await res.json()) as StravaSubscriptionStatus;
  } catch {
    return null;
  }
}
