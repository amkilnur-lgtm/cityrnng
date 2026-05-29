import { Injectable, Logger } from "@nestjs/common";
import { AttendanceSource, EventStatus, SyncProvider } from "@prisma/client";
import { EventOccurrenceService } from "../events/event-occurrence.service";
import { StravaSubscriptionService } from "../integrations/strava/strava-subscription.service";
import { PrismaService } from "../prisma/prisma.service";

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

export interface DashboardSummary {
  health: {
    webhookSubscription: {
      active: boolean;
      callbackUrl: string;
      subscriptionId: number | null;
      registeredAt: string | null;
      callbackMatches: boolean;
    };
    lastIngestAt: string | null;
    cachedActivities: number;
  };
  kpis: {
    totalUsers: number;
    newUsers7d: number;
    stravaConnected: number;
    activeRunners7d: number;
    pointsInCirculation: number;
  };
  stravaFlow: {
    ingested7d: number;
    attendances7dAuto: number;
    attendances7dManual: number;
    matchRate7dPct: number | null;
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
  private readonly logger = new Logger(AdminDashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscription: StravaSubscriptionService,
    private readonly occurrences: EventOccurrenceService,
  ) {}

  async summary(): Promise<DashboardSummary> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - WEEK_MS);

    const [
      webhookHealth,
      lastIngest,
      cachedActivities,
      totalUsers,
      newUsers7d,
      stravaConnected,
      activeRunners7d,
      pointsAccountSum,
      ingested7d,
      attendances7d,
      events,
    ] = await Promise.all([
      this.webhookHealth(),
      this.prisma.externalActivity.findFirst({
        where: { provider: SyncProvider.strava },
        orderBy: { ingestedAt: "desc" },
        select: { ingestedAt: true },
      }),
      this.prisma.externalActivity.count({
        where: { provider: SyncProvider.strava },
      }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.userProviderAccount.count({
        where: { provider: SyncProvider.strava, disconnectedAt: null },
      }),
      this.activeRunnersIn(weekAgo, now),
      this.prisma.pointAccount.aggregate({ _sum: { balance: true } }),
      this.prisma.externalActivity.count({
        where: {
          provider: SyncProvider.strava,
          ingestedAt: { gte: weekAgo },
        },
      }),
      this.prisma.eventAttendance.groupBy({
        by: ["source"],
        where: { matchedAt: { gte: weekAgo } },
        _count: { _all: true },
      }),
      this.eventsSummary(now),
    ]);

    const attendances7dAuto =
      attendances7d.find((a) => a.source === AttendanceSource.sync)?._count._all ?? 0;
    const attendances7dManual =
      attendances7d.find((a) => a.source === AttendanceSource.manual_admin)?._count._all ?? 0;

    // Match rate = sync-attendances in the window ÷ activities ingested in the window.
    // Not a perfect ratio (a 7d activity could match an event from earlier),
    // but a useful health proxy: low = matcher misfires, high = clean.
    const matchRate7dPct =
      ingested7d > 0
        ? Math.round((attendances7dAuto / ingested7d) * 100)
        : null;

    return {
      health: {
        webhookSubscription: webhookHealth,
        lastIngestAt: lastIngest?.ingestedAt?.toISOString() ?? null,
        cachedActivities,
      },
      kpis: {
        totalUsers,
        newUsers7d,
        stravaConnected,
        activeRunners7d,
        pointsInCirculation: pointsAccountSum._sum.balance ?? 0,
      },
      stravaFlow: {
        ingested7d,
        attendances7dAuto,
        attendances7dManual,
        matchRate7dPct,
      },
      events,
    };
  }

  private async webhookHealth(): Promise<DashboardSummary["health"]["webhookSubscription"]> {
    const wanted = this.subscription.callbackUrl();
    try {
      const current = await this.subscription.getCurrent();
      if (!current) {
        return {
          active: false,
          callbackUrl: wanted,
          subscriptionId: null,
          registeredAt: null,
          callbackMatches: false,
        };
      }
      return {
        active: true,
        callbackUrl: wanted,
        subscriptionId: current.id,
        registeredAt: current.created_at,
        callbackMatches: current.callback_url === wanted,
      };
    } catch (err) {
      this.logger.warn(`webhook health check failed: ${(err as Error).message}`);
      return {
        active: false,
        callbackUrl: wanted,
        subscriptionId: null,
        registeredAt: null,
        callbackMatches: false,
      };
    }
  }

  private async activeRunnersIn(from: Date, to: Date): Promise<number> {
    const rows = await this.prisma.eventAttendance.findMany({
      where: { matchedAt: { gte: from, lte: to } },
      select: { userId: true },
      distinct: ["userId"],
    });
    return rows.length;
  }

  private async eventsSummary(now: Date): Promise<DashboardSummary["events"]> {
    // Next upcoming: nearest materialized occurrence in the next 14 days.
    // Reuses event-occurrence logic so rule-based regulars surface too.
    const horizonFuture = new Date(now.getTime() + 14 * DAY_MS);
    const upcoming = await this.occurrences.listInRange(now, horizonFuture);
    const next = upcoming[0] ?? null;

    // Last past: latest explicit event with startsAt < now. Materialized rule
    // occurrences past will exist as Event rows only if they were materialized
    // (RSVP or matcher created them); we scan only real Event rows for this.
    const pastEvent = await this.prisma.event.findFirst({
      where: { status: EventStatus.published, startsAt: { lt: now } },
      orderBy: { startsAt: "desc" },
    });

    const [nextGoing, nextAttended] = next
      ? await Promise.all([
          this.prisma.eventInterest.count({
            where: { eventKey: next.id, status: "going" },
          }),
          this.prisma.eventAttendance.count({
            where: { eventId: next.id },
          }),
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
