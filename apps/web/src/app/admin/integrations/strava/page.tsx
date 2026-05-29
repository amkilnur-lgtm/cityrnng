import { redirect } from "next/navigation";

// Permanent redirect from the legacy path. The Strava admin pages moved
// under /admin/strava/ on 2026-05-29 to group everything Strava-related
// under one sidebar entry. Old bookmarks still work via this redirect.
export default function LegacyStravaRedirect(): never {
  redirect("/admin/strava/webhook");
}
