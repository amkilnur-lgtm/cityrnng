import { API_BASE_URL } from "@/lib/api-config";
import { apiFetch } from "@/lib/api-fetch";

export type TimelineCellKind = "done" | "skipped" | "tomorrow" | "upcoming";

export type TimelineCell = {
  date: string;
  weekdayShort: string;
  eventId: string;
  eventType: "regular" | "special" | "partner";
  title: string;
  dateLabel: string;
  time: string;
  kind: TimelineCellKind;
  km?: number;
  points?: number;
};

export type Timeline = {
  monthLabel: string;
  cells: TimelineCell[];
  totals: { done: number; total: number; progressPct: number };
};

/**
 * Fetch the current user's month-grid for /app dashboard.
 * Returns null when there's no session (dev-mock callers fall back to
 * static WEEK_CELLS so the UI stays useful in mock-only flows).
 */
export async function getMyTimeline(monthOffset = 0): Promise<Timeline | null> {
  const res = await apiFetch(
    `${API_BASE_URL}/me/timeline?monthOffset=${monthOffset}`,
  );
  if (!res || !res.ok) return null;
  return (await res.json()) as Timeline;
}
