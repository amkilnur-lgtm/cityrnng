import { API_BASE_URL } from "@/lib/api-config";
import { apiFetch } from "@/lib/api-fetch";

export type PartnerMembership = {
  partnerId: string;
  partnerSlug: string;
  partnerName: string;
};

/** Server-side: list partners the current user is a member of. */
export async function listMyMemberships(): Promise<PartnerMembership[]> {
  const res = await apiFetch(`${API_BASE_URL}/partner/memberships`);
  if (!res || !res.ok) return [];
  return (await res.json()) as PartnerMembership[];
}
