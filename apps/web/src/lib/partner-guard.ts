import { redirect } from "next/navigation";
import { getSession, type AuthedUser } from "@/lib/session";

/**
 * Server-side guard for /partner/*. Requires an authenticated user with
 * the `partner` role. Membership in a specific partner team is enforced
 * downstream by the API, not here — a partner-role user without any
 * memberships still reaches the page and sees the empty-state message.
 *
 * Authed-but-not-partner → redirect to "/" (their normal home).
 * Not authed → redirect to /auth.
 */
export async function requirePartner(): Promise<AuthedUser> {
  const session = await getSession();
  if (!session) redirect("/auth");
  if (!session.roles?.includes("partner")) redirect("/");
  return session;
}
