import { API_BASE_URL } from "@/lib/api-config";
import { apiFetch } from "@/lib/api-fetch";

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

export async function getStravaSubscriptionStatus(): Promise<StravaSubscriptionStatus | null> {
  const res = await apiFetch(
    `${API_BASE_URL}/admin/integrations/strava/subscription`,
  );
  if (!res || !res.ok) return null;
  return (await res.json()) as StravaSubscriptionStatus;
}
