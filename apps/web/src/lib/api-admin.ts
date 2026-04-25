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
