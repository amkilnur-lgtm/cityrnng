import { cookies } from "next/headers";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

export type PartnerMembership = {
  partnerId: string;
  partnerSlug: string;
  partnerName: string;
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
