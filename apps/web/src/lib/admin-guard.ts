import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, type AuthedUser } from "@/lib/session";

const DEV_STATE_COOKIE = "cityrnng_dev_state";

export type AdminContext =
  | { kind: "real"; session: AuthedUser }
  | { kind: "dev" };

/**
 * Server-side admin guard. Resolves either a real admin session or a
 * dev-cookie admin (only outside production). Anything else redirects.
 *
 * Use at the top of every /admin/* page:
 *   const ctx = await requireAdmin();
 */
export async function requireAdmin(): Promise<AdminContext> {
  const session = await getSession();
  if (session?.roles?.includes("admin")) {
    return { kind: "real", session };
  }

  if (process.env.NODE_ENV !== "production") {
    const dev = cookies().get(DEV_STATE_COOKIE)?.value;
    if (dev === "admin") {
      return { kind: "dev" };
    }
  }

  // Authed-but-not-admin → home; not authed → /auth
  redirect(session ? "/" : "/auth");
}
