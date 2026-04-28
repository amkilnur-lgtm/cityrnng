import { cookies } from "next/headers";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

/**
 * Server-side admin API client. Uses the access-token cookie. Real admin
 * sessions get real data; dev-mock admin (no token) gets empty fallbacks.
 */

function adminHeaders(): HeadersInit | null {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  const headers = adminHeaders();
  if (!headers) return null;
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      cache: "no-store",
      headers: { ...headers, ...(init?.headers ?? {}) },
    });
    if (!res.ok) return null;
    if (res.status === 204) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// === Location admin types ===

export type AdminLocation = {
  id: string;
  slug: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  radiusMeters: number | null;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
};

export async function listAdminLocations(): Promise<AdminLocation[]> {
  return (await fetchJson<AdminLocation[]>("/admin/locations")) ?? [];
}

// === Partner admin types ===

export type AdminPartner = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  contactEmail: string | null;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
};

export async function listAdminPartners(): Promise<AdminPartner[]> {
  return (await fetchJson<AdminPartner[]>("/admin/partners")) ?? [];
}

// === Reward admin types ===

export type AdminReward = {
  id: string;
  slug: string;
  partnerId: string;
  title: string;
  description: string | null;
  costPoints: number;
  badge: string | null;
  status: "active" | "archived";
  validFrom: string | null;
  validUntil: string | null;
  capacity: number | null;
  soldCount: number;
  partner: AdminPartner;
  createdAt: string;
  updatedAt: string;
};

export async function listAdminRewards(opts: { partnerId?: string } = {}): Promise<
  AdminReward[]
> {
  const qs = opts.partnerId ? `?partnerId=${encodeURIComponent(opts.partnerId)}` : "";
  return (await fetchJson<AdminReward[]>(`/admin/rewards${qs}`)) ?? [];
}

// === Recurrence rule admin types ===

export type AdminRecurrenceRuleLocation = {
  ruleId: string;
  locationId: string;
  location: AdminLocation;
};

export type AdminRecurrenceRule = {
  id: string;
  title: string;
  type: "regular" | "special" | "partner";
  status: "active" | "paused";
  dayOfWeek: number;
  timeOfDay: string;
  durationMinutes: number;
  isPointsEligible: boolean;
  basePointsAward: number;
  startsFromDate: string;
  endsAtDate: string | null;
  createdAt: string;
  updatedAt: string;
  locations: AdminRecurrenceRuleLocation[];
};

export async function listAdminRecurrenceRules(): Promise<AdminRecurrenceRule[]> {
  return (await fetchJson<AdminRecurrenceRule[]>("/admin/recurrence-rules")) ?? [];
}

// === Event admin types ===

export type AdminEvent = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: "regular" | "special" | "partner";
  status: "draft" | "published" | "started" | "finished" | "cancelled";
  startsAt: string;
  endsAt: string;
  locationName: string | null;
  locationAddress: string | null;
  locationLat: number | null;
  locationLng: number | null;
  capacity: number | null;
  registrationOpenAt: string | null;
  registrationCloseAt: string | null;
  isPointsEligible: boolean;
  basePointsAward: number;
  recurrenceRuleId: string | null;
  overridesOccurrenceAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listAdminEvents(): Promise<AdminEvent[]> {
  return (await fetchJson<AdminEvent[]>("/admin/events")) ?? [];
}

// === Attendance admin types ===

export type AdminAttendance = {
  id: string;
  eventId: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  source: "sync" | "manual_admin";
  matchedAt: string | null;
  reviewedAt: string | null;
  reviewedById: string | null;
  rejectionReason: string | null;
  createdAt: string;
  user: { id: string; email: string };
  event: {
    id: string;
    title: string;
    startsAt: string;
    type: "regular" | "special" | "partner";
  };
};

export async function listAdminAttendances(
  opts: { status?: "pending" | "approved" | "rejected" } = {},
): Promise<AdminAttendance[]> {
  const qs = opts.status ? `?status=${opts.status}` : "";
  return (await fetchJson<AdminAttendance[]>(`/admin/attendances${qs}`)) ?? [];
}

// === User admin types ===

export type AdminUserRole = "runner" | "admin" | "partner";

export type AdminUser = {
  id: string;
  email: string;
  status: "pending" | "active" | "blocked";
  createdAt: string;
  profile: {
    displayName: string;
    firstName: string | null;
    lastName: string | null;
    city: string | null;
  } | null;
  roles: Array<{ role: { code: AdminUserRole; name: string } }>;
  pointAccount: { balance: number } | null;
};

export type AdminUsersPage = {
  rows: AdminUser[];
  nextCursor: string | null;
};

export async function listAdminUsers(
  opts: { limit?: number; cursor?: string } = {},
): Promise<AdminUsersPage> {
  const params = new URLSearchParams();
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.cursor) params.set("cursor", opts.cursor);
  const qs = params.toString();
  const result = await fetchJson<AdminUsersPage>(
    `/admin/users${qs ? `?${qs}` : ""}`,
  );
  return result ?? { rows: [], nextCursor: null };
}
