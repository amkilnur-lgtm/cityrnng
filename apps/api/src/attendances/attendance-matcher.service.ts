import { Injectable, Logger } from "@nestjs/common";
import {
  AttendanceSource,
  AttendanceStatus,
  CityLocation,
  CityLocationStatus,
  Event,
  EventSyncRule,
  ExternalActivity,
  Prisma,
  SyncProvider,
} from "@prisma/client";
import { PointsAwardsService } from "../points/points-awards.service";
import { PrismaService } from "../prisma/prisma.service";

const DEFAULT_LOCATION_RADIUS_METERS = 500;

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

    const rules = (await this.prisma.eventSyncRule.findMany({
      where: {
        provider: SyncProvider.strava,
        windowEndsAt: { gte: minStart },
        windowStartsAt: { lte: maxStart },
      },
      orderBy: [{ windowStartsAt: "asc" }, { eventId: "asc" }],
      include: {
        event: true,
        locations: {
          where: { location: { status: CityLocationStatus.active } },
          include: { location: true },
        },
      },
    })) as SyncRuleWithContext[];

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

  private async createAttendanceAndAward(
    userId: string,
    activity: ExternalActivity,
    rule: SyncRuleWithContext,
  ): Promise<{ created: boolean; awarded: boolean }> {
    try {
      return await this.prisma.$transaction(async (tx) => {
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
    if (activity.startedAt < rule.windowStartsAt) return false;
    if (activityEnd > rule.windowEndsAt) return false;

    if (rule.activityType) {
      const expected = rule.activityType.toLowerCase();
      const actual = (activity.activityType ?? "").toLowerCase();
      if (expected !== actual) return false;
    }

    if (rule.minDistanceMeters != null && activity.distanceMeters < rule.minDistanceMeters) return false;
    if (rule.maxDistanceMeters != null && activity.distanceMeters > rule.maxDistanceMeters) return false;

    if (rule.minDurationSeconds != null && activity.elapsedSeconds < rule.minDurationSeconds) return false;
    if (rule.maxDurationSeconds != null && activity.elapsedSeconds > rule.maxDurationSeconds) return false;

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
