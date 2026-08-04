import { redirect } from "next/navigation";
import { getSession, type AuthedUser } from "@/lib/session";

/**
 * Server-side guard for /leader/*. Requires an authenticated user with the
 * `leader` role. Not authed → /auth; authed but not a leader → their home.
 * The web middleware refreshes the access token on the /leader path, so a
 * freshly-granted role is reflected here without a manual relogin.
 */
export async function requireLeader(): Promise<AuthedUser> {
  const session = await getSession();
  if (!session) redirect("/auth");
  if (!session.roles?.includes("leader")) redirect("/");
  return session;
}
