import { cookies } from "next/headers";
import { getPointsBalance } from "@/lib/api-points";
import {
  MOCK_GUEST,
  resolveSiteState,
  type SiteState,
} from "@/lib/home-mock";
import { getSession } from "@/lib/session";

const DEV_STATE_COOKIE = "cityrnng_dev_state";

/**
 * Single entry-point that pages call to get the SiteState shown by SiteNav
 * and conditional content blocks. Reads session + points balance in parallel
 * and falls back gracefully when API is unreachable.
 *
 * Resolution order:
 *   1. Real authenticated session (cityrnng_at cookie + GET /me) — wins
 *   2. Dev cookie cityrnng_dev_state="authed" — fake-authed for every page
 *   3. Optional searchParamState (?state=authed) — last-resort URL trigger,
 *      only home page passes this in for backward compat
 *   4. Guest
 */
export async function getSiteState(searchParamState?: string): Promise<SiteState> {
  const session = await getSession();
  if (session) {
    const balance = await getPointsBalance();
    const displayName =
      session.profile?.displayName?.trim() || session.email.split("@")[0];
    return {
      isAuthed: true,
      user: {
        name: displayName,
        initial: displayName.slice(0, 1).toUpperCase(),
        points: balance?.balance ?? 0,
      },
    };
  }

  // Dev-only fake-authed shortcut. Production strips the cookie path
  // entirely so a maliciously-set cookie can't unlock authed state.
  if (process.env.NODE_ENV !== "production") {
    const devCookie = cookies().get(DEV_STATE_COOKIE)?.value;
    if (devCookie === "authed") {
      return resolveSiteState("authed");
    }
  }

  return resolveSiteState(searchParamState);
}

/** Shortcut for pages that don't accept the dev toggle. */
export async function getSiteStateOrGuest(): Promise<SiteState> {
  return getSiteState();
}

/** Re-export so pages can switch from the mock-only helper without touching imports. */
export { MOCK_GUEST };
