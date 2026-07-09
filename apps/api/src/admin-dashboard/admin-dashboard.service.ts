import { Injectable } from "@nestjs/common";
import {
  AttendanceSource,
  CheckinScanResult,
  EventStatus,
  ScanDeviceStatus,
} from "@prisma/client";
import { EventOccurrenceService } from "../events/event-occurrence.service";
import { PrismaService } from "../prisma/prisma.service";

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RULE_KEY_RE = /^rule:([0-9a-f-]{36}):(\d{4}-\d{2}-\d{2})$/i;

export interface DashboardSummary {
  health: {
    scanners: {
      total: number;
      active: number;
      /** Devices that phoned home within the last 7 days. */
      seen7d: number;
      lastSeenAt: string | null;
    };
    lastScanAt: string | null;
    totalScans: number;
  };
  kpis: {
    totalUsers: number;
    newUsers7d: number;
    withCheckinCode: number;
    activeRunners7d: number;
    pointsInCirculation: number;
  };
  checkinFlow: {
    scans7d: number;
    matched7d: number;
    duplicates7d: number;
    noWindow7d: number;
    unknownCode7d: number;
    errors7d: number;
    attendances7dQr: number;
    attendances7dManual: number;
  };
  events: {
    next: SummaryEvent | null;
    lastPast: SummaryEvent | null;
  };
}

interface SummaryEvent {
  id: string;
  title: string;
  type: string;
  startsAt: string;
  goingCount: number;
  attendedCount: number;
}

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly occurrences: EventOccurrenceService,
  ) {}

  async summary(): Promise<DashboardSummary> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - WEEK_MS);

    const [
      scannersTotal,
      scannersActive,
      scannersSeen7d,
      lastSeenDevice,
      lastScan,
      totalScans,
      totalUsers,
      newUsers7d,
      withCheckinCode,
      activeRunners7d,
      pointsAccountSum,
      scans7dByResult,
      attendances7d,
      events,
    ] = await Promise.all([
      this.prisma.scanDevice.count(),
      this.prisma.scanDevice.count({ where: { status: ScanDeviceStatus.active } }),
      this.prisma.scanDevice.count({ where: { lastSeenAt: { gte: weekAgo } } }),
      this.prisma.scanDevice.findFirst({
        where: { lastSeenAt: { not: null } },
        orderBy: { lastSeenAt: "desc" },
        select: { lastSeenAt: true },
      }),
      this.prisma.checkinScan.findFirst({
        orderBy: { scannedAt: "desc" },
        select: { scannedAt: true },
      }),
      this.prisma.checkinScan.count(),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.user.count({ where: { checkinCode: { not: null } } }),
      this.activeRunnersIn(weekAgo, now),
      this.prisma.pointAccount.aggregate({ _sum: { balance: true } }),
      this.prisma.checkinScan.groupBy({
        by: ["result"],
        where: { scannedAt: { gte: weekAgo } },
        _count: { _all: true },
      }),
      this.prisma.eventAttendance.groupBy({
        by: ["source"],
        where: { matchedAt: { gte: weekAgo } },
        _count: { _all: true },
      }),
      this.eventsSummary(now),
    ]);

    const byResult = (r: CheckinScanResult) =>
      scans7dByResult.find((s) => s.result === r)?._count._all ?? 0;
    const bySource = (s: AttendanceSource) =>
      attendances7d.find((a) => a.source === s)?._count._all ?? 0;

    return {
      health: {
        scanners: {
          total: scannersTotal,
          active: scannersActive,
          seen7d: scannersSeen7d,
          lastSeenAt: lastSeenDevice?.lastSeenAt?.toISOString() ?? null,
        },
        lastScanAt: lastScan?.scannedAt?.toISOString() ?? null,
        totalScans,
      },
      kpis: {
        totalUsers,
        newUsers7d,
        withCheckinCode,
        activeRunners7d,
        pointsInCirculation: pointsAccountSum._sum.balance ?? 0,
      },
      checkinFlow: {
        scans7d: scans7dByResult.reduce((s, r) => s + r._count._all, 0),
        matched7d: byResult(CheckinScanResult.matched),
        duplicates7d: byResult(CheckinScanResult.duplicate),
        noWindow7d: byResult(CheckinScanResult.no_window),
        unknownCode7d: byResult(CheckinScanResult.unknown_code),
        errors7d: byResult(CheckinScanResult.error),
        attendances7dQr: bySource(AttendanceSource.qr_scan),
        attendances7dManual: bySource(AttendanceSource.manual_admin),
      },
      events,
    };
  }

  private async activeRunnersIn(from: Date, to: Date): Promise<number> {
    const rows = await this.prisma.eventAttendance.findMany({
      where: { matchedAt: { gte: from, lte: to } },
      select: { userId: true },
      distinct: ["userId"],
    });
    return rows.length;
  }

  /**
   * Resolve a public event-id (either UUID or synthetic `rule:UUID:DATE`)
   * to the real Event row UUID. Returns null for rule occurrences that
   * haven't been materialized yet (no override Event exists for that date).
   */
  private async resolveEventUuid(publicId: string): Promise<string | null> {
    if (UUID_RE.test(publicId)) return publicId;
    const m = publicId.match(RULE_KEY_RE);
    if (!m) return null;
    const [, ruleId, dateStr] = m;
    const day = new Date(`${dateStr}T00:00:00.000Z`);
    const ev = await this.prisma.event.findFirst({
      where: { recurrenceRuleId: ruleId, overridesOccurrenceAt: day },
      select: { id: true },
    });
    return ev?.id ?? null;
  }

  private async eventsSummary(now: Date): Promise<DashboardSummary["events"]> {
    // Next upcoming: nearest materialized occurrence in the next 14 days.
    // Reuses event-occurrence logic so rule-based regulars surface too.
    const horizonFuture = new Date(now.getTime() + 14 * DAY_MS);
    const upcoming = await this.occurrences.listInRange(now, horizonFuture);
    const next = upcoming[0] ?? null;

    // Last past: latest explicit event with startsAt < now. Materialized rule
    // occurrences past will exist as Event rows only if they were materialized
    // (RSVP or check-in created them); we scan only real Event rows for this.
    const pastEvent = await this.prisma.event.findFirst({
      where: { status: EventStatus.published, startsAt: { lt: now } },
      orderBy: { startsAt: "desc" },
    });

    // next.id can be a synthetic rule-key (`rule:UUID:DATE`) when the
    // occurrence isn't materialized yet — see PR #123. EventAttendance.eventId
    // is a UUID column, so passing the rule-key to `eventAttendance.count`
    // makes Prisma blow up with "Inconsistent column data: Error creating
    // UUID". Resolve to the override Event's real UUID first; if no override
    // exists yet, attendedCount is naturally 0 (nobody could check in because
    // no backing event existed). EventInterest.eventKey is a String column,
    // so the rule-key works there.
    const nextEventUuid = next ? await this.resolveEventUuid(next.id) : null;
    const [nextGoing, nextAttended] = next
      ? await Promise.all([
          this.prisma.eventInterest.count({
            where: { eventKey: next.id, status: "going" },
          }),
          nextEventUuid
            ? this.prisma.eventAttendance.count({ where: { eventId: nextEventUuid } })
            : Promise.resolve(0),
        ])
      : [0, 0];

    const [pastGoing, pastAttended] = pastEvent
      ? await Promise.all([
          this.prisma.eventInterest.count({
            where: { eventKey: pastEvent.id, status: "going" },
          }),
          this.prisma.eventAttendance.count({
            where: { eventId: pastEvent.id },
          }),
        ])
      : [0, 0];

    return {
      next: next
        ? {
            id: next.id,
            title: next.title,
            type: next.type,
            startsAt: next.startsAt.toISOString(),
            goingCount: nextGoing,
            attendedCount: nextAttended,
          }
        : null,
      lastPast: pastEvent
        ? {
            id: pastEvent.id,
            title: pastEvent.title,
            type: pastEvent.type,
            startsAt: pastEvent.startsAt.toISOString(),
            goingCount: pastGoing,
            attendedCount: pastAttended,
          }
        : null,
    };
  }
}
