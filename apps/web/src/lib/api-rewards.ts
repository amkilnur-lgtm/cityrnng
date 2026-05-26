import { cookies } from "next/headers";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

/**
 * Public + authed fetchers for the rewards/partners domain.
 * Mirrors response shapes from apps/api/src/rewards/*.service.ts.
 *
 * Public reads (`listPartners`, `listRewards`, `getReward`) hit the API
 * unauthenticated. Authed reads (`listMyRedemptions`) require the access
 * cookie; absent cookie or API error → null/empty so pages keep rendering
 * in dev-mock mode without the API running.
 */

export type PartnerStatus = "active" | "archived";
export type RewardStatus = "active" | "archived";
export type RedemptionStatus = "active" | "used" | "expired" | "cancelled";

export type ApiPartner = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  contactEmail: string | null;
  status: PartnerStatus;
  createdAt: string;
  updatedAt: string;
};

export type ApiReward = {
  id: string;
  slug: string;
  partnerId: string;
  title: string;
  description: string | null;
  costPoints: number;
  badge: string | null;
  status: RewardStatus;
  validFrom: string | null;
  validUntil: string | null;
  capacity: number | null;
  soldCount: number;
  partner: ApiPartner;
  createdAt: string;
  updatedAt: string;
};

export type ApiRedemption = {
  id: string;
  userId: string;
  rewardId: string;
  costPoints: number;
  status: RedemptionStatus;
  code: string;
  pointTxnId: string;
  expiresAt: string | null;
  usedAt: string | null;
  usedById: string | null;
  cancelledAt: string | null;
  cancelledReason: string | null;
  createdAt: string;
  reward: ApiReward;
};

function authHeaders(): HeadersInit | null {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

export async function listPartners(): Promise<ApiPartner[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/partners`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as ApiPartner[];
  } catch {
    return [];
  }
}

export async function listRewards(opts: { partnerSlug?: string } = {}): Promise<
  ApiReward[]
> {
  const url = new URL(`${API_BASE_URL}/rewards`);
  if (opts.partnerSlug) url.searchParams.set("partner", opts.partnerSlug);
  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as ApiReward[];
  } catch {
    return [];
  }
}

export async function getReward(slug: string): Promise<ApiReward | null> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/rewards/${encodeURIComponent(slug)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json()) as ApiReward;
  } catch {
    return null;
  }
}

export async function listMyRedemptions(): Promise<ApiRedemption[]> {
  const headers = authHeaders();
  if (!headers) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/me/redemptions`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as ApiRedemption[];
  } catch {
    return [];
  }
}

export type ApiAdminRedemption = ApiRedemption & {
  user: {
    id: string;
    email: string;
    profile: { displayName: string | null } | null;
  };
};

/** Admin-only — list all redemptions with optional filters. */
export async function listRedemptionsAdmin(opts: {
  status?: RedemptionStatus;
  partnerId?: string;
  code?: string;
}): Promise<ApiAdminRedemption[]> {
  const headers = authHeaders();
  if (!headers) return [];
  const url = new URL(`${API_BASE_URL}/admin/redemptions`);
  if (opts.status) url.searchParams.set("status", opts.status);
  if (opts.partnerId) url.searchParams.set("partnerId", opts.partnerId);
  if (opts.code) url.searchParams.set("code", opts.code);
  try {
    const res = await fetch(url.toString(), {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as ApiAdminRedemption[];
  } catch {
    return [];
  }
}
