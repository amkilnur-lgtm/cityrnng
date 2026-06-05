import { cookies } from "next/headers";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

export type PartnerMembership = {
  partnerId: string;
  partnerSlug: string;
  partnerName: string;
};

export type PartnerRecentRedemption = {
  id: string;
  code: string;
  status: "active" | "used" | "expired" | "cancelled";
  createdAt: string;
  usedAt: string | null;
  partnerName: string;
  partnerSlug: string;
  rewardTitle: string;
  userEmail: string;
  userDisplayName: string | null;
};

function authHeaders(): HeadersInit | null {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

/** Server-side: list partners the current user is a member of. */
export async function listMyMemberships(): Promise<PartnerMembership[]> {
  const headers = authHeaders();
  if (!headers) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/partner/memberships`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as PartnerMembership[];
  } catch {
    return [];
  }
}

/**
 * Server-side: last 20 redemptions across all partner-teams the user belongs
 * to. Empty array when user is not authed, has no memberships, or API down.
 */
export async function listPartnerRecentRedemptions(): Promise<
  PartnerRecentRedemption[]
> {
  const headers = authHeaders();
  if (!headers) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/partner/redemptions/recent`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as PartnerRecentRedemption[];
  } catch {
    return [];
  }
}
