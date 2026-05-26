import { Inject, Injectable, Logger, forwardRef } from "@nestjs/common";
import {
  AttendanceSource,
  AttendanceStatus,
  CityLocation,
  CityLocationStatus,
  Event,
  EventSyncRule,
  EventType,
  ExternalActivity,
  Prisma,
  RecurrenceRuleStatus,
  SyncProvider,
} from "@prisma/client";
import { EventOccurrenceService } from "../events/event-occurrence.service";
import { PointsAwardsService } from "../points/points-awards.service";
import { PrismaService } from "../prisma/prisma.service";

const DEFAULT_LOCATION_RADIUS_METERS = 500;
// Buffer applied around event.startsAt/endsAt when matching Strava activities.
// Hardcoded for now — admin can't override per-event yet.
const MATCH_WINDOW_BUFFER_MS = 30 * 60 * 1000;

type SyncRuleWithContext = EventSyncRule & {
  event: Event;
  locations: Array<{ location: CityLocation }>;
};

export interface MatchOptions {
  after?: Date;
  before?: Date;
}

export interface MatchSummary {
  activitiesEvaluated: number;
  rulesConsidered: number;
  candidatesAttempted: number;
  attendancesCreated: number;
  awardsPosted: number;
}

@Injectable()
export class AttendanceMatcherService {
  private readonly logger = new Logger(AttendanceMatcherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsAwards: PointsAwardsService,
    @Inject(forwardRef(() => EventOccurrenceService))
    private readonly occurrences: EventOccurrenceService,
  ) {}

  async matchForUser(userId: string, options: MatchOptions = {}): Promise<MatchSummary> {
    const activityWhere: Prisma.ExternalActivityWhereInput = {
      userId,
      provider: SyncProvider.strava,
    };
    if (options.after || options.before) {
      activityWhere.startedAt = {};
      if (options.after) activityWhere.startedAt.gte = options.after;
      if (options.before) activityWhere.startedAt.lte = options.before;
    }

    const activities = await this.prisma.externalActivity.findMany({
      where: activityWhere,
      orderBy: [{ startedAt: "asc" }, { id: "asc" }],
    });
    if (activities.length === 0) {
      return {
        activitiesEvaluated: 0,
        rulesConsidered: 0,
        candidatesAttempted: 0,
        attendancesCreated: 0,
        awardsPosted: 0,
      };
    }

    const minStart = activities[0]!.startedAt;
    const maxStart = activities[activities.length - 1]!.startedAt;

    // Pre-step: materialize Event-rows for every regular recurrence occurrence
    // that any activity's time window could overlap. Otherwise EventSyncRule
    // for that rule date doesn't exist yet and the matcher can't write
    // attendance. Idempotent — repeated calls are no-ops.
    await this.materializeRuleOccurrencesInRange(
      new Date(minStart.getTime() - MATCH_WINDOW_BUFFER_MS),
      new Date(maxStart.getTime() + MATCH_WINDOW_BUFFER_MS),
    );

    // Pre-filter rules by event time (with buffer) instead of the legacy
    // windowStartsAt/EndsAt fields — those are no longer the source of truth
    // for the match window.
    const rulesRaw = (await this.prisma.eventSyncRule.findMany({
      where: {
        provider: SyncProvider.strava,
        event: {
          endsAt: { gte: new Date(minStart.getTime() - MATCH_WINDOW_BUFFER_MS) },
          startsAt: { lte: new Date(maxStart.getTime() + MATCH_WINDOW_BUFFER_MS) },
        },
      },
      include: {
        event: true,
        locations: {
          where: { location: { status: CityLocationStatus.active } },
          include: { location: true },
        },
      },
    })) as SyncRuleWithContext[];
    // Sort so special events win the same-day race with regular events.
    // Combined with the per-user one-per-day guard below, this guarantees
    // that on a date with both a special and a regular, the special is
    // the one credited.
    const typeOrder: Record<EventType, number> = {
      [EventType.special]: 0,
      [EventType.partner]: 1,
      [EventType.regular]: 2,
    };
    const rules = rulesRaw.sort((a, b) => {
      const dt = a.event.startsAt.getTime() - b.event.startsAt.getTime();
      if (dt !== 0) return dt;
      return typeOrder[a.event.type] - typeOrder[b.event.type];
    });

    let candidatesAttempted = 0;
    let attendancesCreated = 0;
    let awardsPosted = 0;

    for (const activity of activities) {
      for (const rule of rules) {
        if (!this.ruleMatchesActivity(rule, activity)) continue;
        candidatesAttempted += 1;

        const outcome = await this.createAttendanceAndAward(userId, activity, rule);
        if (outcome.created) attendancesCreated += 1;
        if (outcome.awarded) awardsPosted += 1;
      }
    }

    return {
      activitiesEvaluated: activities.length,
      rulesConsidered: rules.length,
      candidatesAttempted,
      attendancesCreated,
      awardsPosted,
    };
  }

  /**
   * Walk every active recurrence rule and materialize any occurrence that
   * falls in [from, to]. Idempotent — ensureMaterializedEvent is a no-op
   * when the row already exists. Bounded by the active-rule set, so cost
   * is O(rules × occurrences_in_window), typically <10 calls per matcher run.
   */
  private async materializeRuleOccurrencesInRange(
    from: Date,
    to: Date,
  ): Promise<void> {
    const rules = await this.prisma.eventRecurrenceRule.findMany({
      where: {
        status: RecurrenceRuleStatus.active,
        startsFromDate: { lte: to },
        OR: [{ endsAtDate: null }, { endsAtDate: { gte: from } }],
      },
      select: {
        id: true,
        dayOfWeek: true,
        timeOfDay: true,
        startsFromDate: true,
        endsAtDate: true,
      },
    });
    const DAY = 86_400_000;
    for (const rule of rules) {
      // Roll a cursor through the window emitting only occurrences on the
      // rule's weekday at its time-of-day.
      let cursor = new Date(from);
      while (cursor <= to) {
        if (cursor.getDay() === rule.dayOfWeek) {
          const [h, m] = rule.timeOfDay.split(":").map((s) => Number.parseInt(s, 10));
          if (!Number.isNaN(h) && !Number.isNaN(m)) {
            const occurrence = new Date(cursor);
            occurrence.setHours(h, m, 0, 0);
            if (
              occurrence >= rule.startsFromDate &&
              (!rule.endsAtDate || occurrence <= rule.endsAtDate)
            ) {
              try {
                await this.occurrences.ensureMaterializedEvent(rule.id, occurrence);
              } catch (err) {
                this.logger.warn(
                  `Failed to materialize occurrence ${rule.id} @ ${occurrence.toISOString()}: ${(err as Error).message}`,
                );
              }
            }
          }
        }
        cursor = new Date(cursor.getTime() + DAY);
      }
    }
  }

  private async createAttendanceAndAward(
    userId: string,
    activity: ExternalActivity,
    rule: SyncRuleWithContext,
  ): Promise<{ created: boolean; awarded: boolean }> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Physical reality: a runner can attend at most one event per day.
        // If we already credited them for any event on this day, skip —
        // even if our geofence/window logic now matches another one.
        // Protects against double-credits when a special event's geofence
        // overlaps a regular's (matcher saw both as valid).
        const dayStart = new Date(rule.event.startsAt);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        const sameDayAttendance = await tx.eventAttendance.findFirst({
          where: {
            userId,
            event: { startsAt: { gte: dayStart, lt: dayEnd } },
          },
          select: { id: true, eventId: true },
        });
        if (sameDayAttendance && sameDayAttendance.eventId !== rule.eventId) {
          this.logger.log(
            `Skipping attendance for user=${userId} event=${rule.eventId} — already attended event=${sameDayAttendance.eventId} on ${dayStart.toISOString().slice(0, 10)}`,
          );
          return { created: false, awarded: false };
        }

        const status = rule.autoApprove ? AttendanceStatus.approved : AttendanceStatus.pending;
        const now = new Date();
        const attendance = await tx.eventAttendance.create({
          data: {
            eventId: rule.eventId,
            userId,
            externalActivityId: activity.id,
            source: AttendanceSource.sync,
            status,
            matchedAt: now,
            reviewedAt: rule.autoApprove ? now : null,
          },
        });

        let awarded = false;
        if (rule.autoApprove) {
          const award = await this.pointsAwards.awardEventAttendance(attendance, rule.event, tx);
          if (award) awarded = true;
        }
        return { created: true, awarded };
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        uniqueTargetIncludes(err, "event_id") &&
        uniqueTargetIncludes(err, "user_id")
      ) {
        // Another attendance already exists for this (event, user) — preserve it, no duplicate.
        return { created: false, awarded: false };
      }
      this.logger.error(
        `Attendance insert failed for user=${userId} event=${rule.eventId} activity=${activity.id}: ${(err as Error).message}`,
      );
      throw err;
    }
  }

  ruleMatchesActivity(rule: SyncRuleWithContext, activity: ExternalActivity): boolean {
    const activityEnd = new Date(activity.startedAt.getTime() + activity.elapsedSeconds * 1000);
    // Match window = event.startsAt − 30m to event.endsAt + 30m.
    const windowStart = new Date(rule.event.startsAt.getTime() - MATCH_WINDOW_BUFFER_MS);
    const windowEnd = new Date(rule.event.endsAt.getTime() + MATCH_WINDOW_BUFFER_MS);
    if (activity.startedAt < windowStart) return false;
    if (activityEnd > windowEnd) return false;

    if (rule.activityType) {
      const expected = rule.activityType.toLowerCase();
      const actual = (activity.activityType ?? "").toLowerCase();
      if (expected !== actual) return false;
    }

    // Special events: skip distance + duration checks — being in the right
    // place at the right time is enough. Regular/partner events still enforce
    // the rule's distance/duration constraints (e.g. minimum 5 km for a Wed
    // run, to filter out warm-ups and random walks).
    const skipDistanceAndDuration = rule.event.type === EventType.special;
    if (!skipDistanceAndDuration) {
      if (rule.minDistanceMeters != null && activity.distanceMeters < rule.minDistanceMeters) return false;
      if (rule.maxDistanceMeters != null && activity.distanceMeters > rule.maxDistanceMeters) return false;
      if (rule.minDurationSeconds != null && activity.elapsedSeconds < rule.minDurationSeconds) return false;
      if (rule.maxDurationSeconds != null && activity.elapsedSeconds > rule.maxDurationSeconds) return false;
    }

    const activeLocations = rule.locations.map((l) => l.location);
    if (activeLocations.length > 0) {
      if (!passesLocations(activeLocations, activity)) return false;
    } else if (
      rule.geofenceLat != null &&
      rule.geofenceLng != null &&
      rule.geofenceRadiusMeters != null
    ) {
      if (!passesLegacyGeofence(rule, activity)) return false;
    }

    return true;
  }
}

function activityPoints(activity: ExternalActivity): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  if (activity.startLat != null && activity.startLng != null) {
    points.push([activity.startLat, activity.startLng]);
  }
  if (activity.endLat != null && activity.endLng != null) {
    points.push([activity.endLat, activity.endLng]);
  }
  return points;
}

function passesLocations(locations: CityLocation[], activity: ExternalActivity): boolean {
  const points = activityPoints(activity);
  if (points.length === 0) return false;
  return locations.some((loc) => {
    const radius = loc.radiusMeters ?? DEFAULT_LOCATION_RADIUS_METERS;
    return points.some(([lat, lng]) => haversineMeters(loc.lat, loc.lng, lat, lng) <= radius);
  });
}

function passesLegacyGeofence(rule: EventSyncRule, activity: ExternalActivity): boolean {
  const lat = rule.geofenceLat!;
  const lng = rule.geofenceLng!;
  const radius = rule.geofenceRadiusMeters!;

  const points = activityPoints(activity);
  if (points.length === 0) return false;

  return points.some(([plat, plng]) => haversineMeters(lat, lng, plat, plng) <= radius);
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function uniqueTargetIncludes(
  err: Prisma.PrismaClientKnownRequestError,
  field: string,
): boolean {
  const target = err.meta?.target;
  if (Array.isArray(target)) return target.includes(field);
  if (typeof target === "string") return target.includes(field);
  return false;
}
