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

export type StravaTraceCandidate = {
  eventId: string;
  eventTitle: string;
  eventStartsAt: string;
  eventType: "regular" | "special" | "partner";
  /** Empty array = activity would match this rule. */
  reasons: string[];
};

export type StravaTraceActivity = {
  externalId: string;
  activityType: string | null;
  startedAt: string;
  elapsedSeconds: number;
  distanceMeters: number;
  startLat: number | null;
  startLng: number | null;
  matchedEventId: string | null;
  matchedEventTitle: string | null;
  candidates: StravaTraceCandidate[];
};

export type StravaTraceResult = {
  activitiesEvaluated: number;
  matchedCount: number;
  activities: StravaTraceActivity[];
};

export type DashboardSummary = {
  health: {
    webhookSubscription: {
      active: boolean;
      callbackUrl: string;
      subscriptionId: number | null;
      registeredAt: string | null;
      callbackMatches: boolean;
    };
    lastIngestAt: string | null;
    cachedActivities: number;
  };
  kpis: {
    totalUsers: number;
    newUsers7d: number;
    stravaConnected: number;
    activeRunners7d: number;
    pointsInCirculation: number;
  };
  stravaFlow: {
    ingested7d: number;
    attendances7dAuto: number;
    attendances7dManual: number;
    matchRate7dPct: number | null;
  };
  events: {
    next: SummaryEvent | null;
    lastPast: SummaryEvent | null;
  };
};

export type SummaryEvent = {
  id: string;
  title: string;
  type: string;
  startsAt: string;
  goingCount: number;
  attendedCount: number;
};

export type DashboardSummaryResult =
  | { ok: true; data: DashboardSummary }
  | { ok: false; status: number; message: string };

export async function getDashboardSummary(): Promise<DashboardSummaryResult> {
  const headers = authHeaders();
  if (!headers) {
    return { ok: false, status: 0, message: "Нет токена в куке — войди заново как admin." };
  }
  try {
    const res = await fetch(`${API_BASE_URL}/admin/dashboard/summary`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
      return {
        ok: false,
        status: res.status,
        message: body.message ?? body.code ?? `HTTP ${res.status}`,
      };
    }
    return { ok: true, data: (await res.json()) as DashboardSummary };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      message: `Не достучались до API: ${(err as Error).message}`,
    };
  }
}

export async function runStravaDebug(opts: {
  userId: string;
  after?: string;
  before?: string;
}): Promise<StravaTraceResult | null> {
  const headers = authHeaders();
  if (!headers) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/admin/integrations/strava/debug`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(opts),
    });
    if (!res.ok) return null;
    return (await res.json()) as StravaTraceResult;
  } catch {
    return null;
  }
}
