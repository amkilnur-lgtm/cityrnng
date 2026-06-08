import { cookies } from "next/headers";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

export type TimelineCellKind =
  | "done"
  | "skipped"
  | "today"
  | "tomorrow"
  | "soon"
  | "upcoming";

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
  /** True если у юзера уже есть `going` RSVP. UI показывает «✓ Я иду» вместо
   *  «Я иду →». Отдаётся бэком только для soon/today/tomorrow. */
  isGoing?: boolean;
};

export type Timeline = {
  monthLabel: string;
  cells: TimelineCell[];
  totals: { done: number; total: number; progressPct: number };
};

function authHeaders(): HeadersInit | null {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

/**
 * Fetch the current user's month-grid for /app dashboard.
 * Returns null when there's no session (dev-mock callers fall back to
 * static WEEK_CELLS so the UI stays useful in mock-only flows).
 */
export async function getMyTimeline(monthOffset = 0): Promise<Timeline | null> {
  const headers = authHeaders();
  if (!headers) return null;
  try {
    const res = await fetch(
      `${API_BASE_URL}/me/timeline?monthOffset=${monthOffset}`,
      { headers, cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json()) as Timeline;
  } catch {
    return null;
  }
}
