import { permanentRedirect } from "next/navigation";

// 308 Permanent Redirect from the legacy path. The Strava admin pages moved
// under /admin/strava/ on 2026-05-29 to group everything Strava-related
// under one sidebar entry. Old bookmarks still work via this redirect; 308
// (vs default 307) tells browsers + crawlers to update their stored URL.
export default function LegacyStravaRedirect(): never {
  permanentRedirect("/admin/strava/webhook");
}
