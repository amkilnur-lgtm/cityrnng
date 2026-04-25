import { getPointsBalance } from "@/lib/api-points";
import {
  MOCK_GUEST,
  resolveSiteState,
  type SiteState,
} from "@/lib/home-mock";
import { getSession } from "@/lib/session";

/**
 * Single entry-point that pages call to get the SiteState shown by SiteNav
 * and conditional content blocks. Reads session + points balance in parallel
 * and falls back gracefully when API is unreachable.
 *
 * Pass `searchParamState` to support the dev `?state=authed` toggle on
 * pages that should keep it (currently only the home page).
 */
export async function getSiteState(searchParamState?: string): Promise<SiteState> {
  const session = await getSession();
  if (!session) {
    return resolveSiteState(searchParamState);
  }

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

/** Shortcut for pages that don't accept the dev toggle. */
export async function getSiteStateOrGuest(): Promise<SiteState> {
  return getSiteState();
}

/** Re-export so pages can switch from the mock-only helper without touching imports. */
export { MOCK_GUEST };
