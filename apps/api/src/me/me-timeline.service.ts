import { Injectable } from "@nestjs/common";
import { EventType } from "@prisma/client";
import {
  EventOccurrenceService,
  type MaterializedEvent,
} from "../events/event-occurrence.service";
import { PrismaService } from "../prisma/prisma.service";

export type TimelineCellKind = "done" | "skipped" | "today" | "tomorrow" | "upcoming";

export interface TimelineCell {
  /** YYYY-MM-DD in club local time (Asia/Yekaterinburg / Moscow — currently
   *  inferred from server's local zone). */
  date: string;
  /** Short weekday label (ВС/ПН/ВТ/СР/ЧТ/ПТ/СБ). */
  weekdayShort: string;
  /** Event used as the "face" of this date — special wins over regular. */
  eventId: string;
  eventType: "regular" | "special" | "partner";
  /** Human title shown on the card. */
  title: string;
  /** "СР · 13 мая" friendly short label for the eyebrow row. */
  dateLabel: string;
  time: string;
  kind: TimelineCellKind;
  /** Distance in km, only when kind === "done" and the source activity has it. */
  km?: number;
  /** Points credited for this attendance, only when kind === "done". */
  points?: number;
}

export interface TimelineResponse {
  monthLabel: string;
  cells: TimelineCell[];
  totals: { done: number; total: number; progressPct: number };
}

const RU_MONTHS_NOM = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];
const RU_MONTHS_GEN_SHORT = [
  "янв", "фев", "мар", "апр", "мая", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];
const RU_WEEKDAYS_SHORT = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];

/**
 * Builds the "this month's runs" grid for /app dashboard. One cell per date
 * that has any event (regular Wednesday or special). When both exist on
 * the same date, the special is the card's face (decision D in our chat).
 *
 * Status resolution per cell:
 *   - done       — user has an EventAttendance on any of the day's events
 *   - tomorrow   — date == today + 1 and no attendance yet
 *   - upcoming   — future date beyond tomorrow, no attendance
 *   - skipped    — past date, no attendance
 *
 * km/points are sourced from the actual EventAttendance + ExternalActivity
 * + PointTransaction when present — not from event defaults — so the card
 * reflects what was really credited.
 *
 * Month window: current calendar month. If fewer than 4 cells fit (e.g.
 * early in the month), tail-pads with the previous month's Wednesdays to
 * keep the grid visually full.
 */
@Injectable()
export class MeTimelineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly occurrences: EventOccurrenceService,
  ) {}

  async build(userId: string, monthOffset = 0): Promise<TimelineResponse> {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const monthStart = new Date(target.getFullYear(), target.getMonth(), 1);
    const monthEnd = new Date(target.getFullYear(), target.getMonth() + 1, 0, 23, 59, 59, 999);

    // Pull events in the month. If we end up with <4 cells, expand backward
    // by adding the previous month so the grid doesn't look bare.
    let from = monthStart;
    const to = monthEnd;
    let events = await this.occurrences.listInRange(from, to);
    let cellsByDate = this.groupByDate(events);
    if (cellsByDate.size < 4) {
      from = new Date(target.getFullYear(), target.getMonth() - 1, 1);
      events = await this.occurrences.listInRange(from, to);
      cellsByDate = this.groupByDate(events);
    }

    // Fetch the user's attendances + linked activity + point transactions
    // for the date window in a single query — saves an N+1 lookup per cell.
    const dateKeys = [...cellsByDate.keys()];
    // EventAttendance.eventId is a real UUID; materialized rule occurrences
    // use synthetic ids like `rule:UUID:DATE` which Prisma can't cast to
    // uuid. Filter those out — they never have attendances anyway because
    // the matcher only fires for events with a real DB row + EventSyncRule.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const realEventIds = events.map((e) => e.id).filter((id) => UUID_RE.test(id));
    const attendances = realEventIds.length > 0
      ? await this.prisma.eventAttendance.findMany({
          where: {
            userId,
            eventId: { in: realEventIds },
          },
          include: {
            externalActivity: { select: { distanceMeters: true } },
          },
        })
      : [];
    // Most recent PointTransaction per attendance.id (reasonRef = attendance id).
    const pointTxns = await this.prisma.pointTransaction.findMany({
      where: {
        userId,
        reasonRef: { in: attendances.map((a) => a.id) },
        direction: "credit",
      },
      select: { reasonRef: true, amount: true },
    });
    const pointsByAttendance = new Map<string, number>();
    for (const t of pointTxns) {
      if (!t.reasonRef) continue;
      pointsByAttendance.set(t.reasonRef, (pointsByAttendance.get(t.reasonRef) ?? 0) + t.amount);
    }
    const attendanceByEventId = new Map(attendances.map((a) => [a.eventId, a]));

    const today = this.dayKey(new Date());
    const tomorrow = this.dayKey(new Date(Date.now() + 24 * 60 * 60 * 1000));

    const cells: TimelineCell[] = dateKeys
      .sort()
      .map((dateKey) => {
        const dayEvents = cellsByDate.get(dateKey)!;
        // "Face" = special if any exists for the day; otherwise the first
        // (regular). Type order from listInRange already sorts special first.
        const face = dayEvents[0]!;
        // Did the user attend ANY event on this day?
        const attended = dayEvents
          .map((e) => attendanceByEventId.get(e.id))
          .find((a) => a != null);
        const cellDate = new Date(face.startsAt);
        const dateKeyStr = this.dayKey(cellDate);

        // Use event.endsAt for the past/future boundary, not just the date.
        // Today's run gets its own kind so the UI can give it the most
        // prominent treatment (red, "СЕГОДНЯ" badge) — it's the most
        // imminent event the user has, more than tomorrow's.
        const now = new Date();
        let kind: TimelineCellKind;
        if (attended) kind = "done";
        else if (face.endsAt < now) kind = "skipped";
        else if (dateKeyStr === today) kind = "today";
        else if (dateKeyStr === tomorrow) kind = "tomorrow";
        else kind = "upcoming";

        const cell: TimelineCell = {
          date: dateKeyStr,
          weekdayShort: RU_WEEKDAYS_SHORT[cellDate.getDay()]!,
          eventId: face.id,
          eventType: face.type as TimelineCell["eventType"],
          title:
            face.title ||
            (face.type === EventType.regular ? "Ситираннинг" : "Спецсобытие"),
          dateLabel: `${RU_WEEKDAYS_SHORT[cellDate.getDay()]} · ${String(cellDate.getDate()).padStart(2, "0")} ${RU_MONTHS_GEN_SHORT[cellDate.getMonth()]}`,
          time: `${String(cellDate.getHours()).padStart(2, "0")}:${String(cellDate.getMinutes()).padStart(2, "0")}`,
          kind,
        };

        if (attended && attended.externalActivity?.distanceMeters) {
          cell.km = Math.round(attended.externalActivity.distanceMeters / 1000);
        }
        if (attended) {
          const pts = pointsByAttendance.get(attended.id);
          if (pts && pts > 0) cell.points = pts;
        }

        return cell;
      });

    const doneCount = cells.filter((c) => c.kind === "done").length;
    return {
      monthLabel: RU_MONTHS_NOM[target.getMonth()]!,
      cells,
      totals: {
        done: doneCount,
        total: cells.length,
        progressPct: cells.length === 0 ? 0 : Math.round((doneCount / cells.length) * 100),
      },
    };
  }

  /** Group materialized events by their local-date string (YYYY-MM-DD). */
  private groupByDate(events: MaterializedEvent[]): Map<string, MaterializedEvent[]> {
    const out = new Map<string, MaterializedEvent[]>();
    for (const e of events) {
      const key = this.dayKey(e.startsAt);
      const arr = out.get(key) ?? [];
      arr.push(e);
      out.set(key, arr);
    }
    return out;
  }

  private dayKey(d: Date): string {
    // Use local-zone Y-M-D so `today` comparison aligns with user expectations.
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
}
