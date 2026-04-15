import { Injectable } from "@nestjs/common";
import {
  AttendanceSource,
  AttendanceStatus,
  EventSyncRule,
  ExternalActivity,
  Prisma,
  SyncProvider,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface MatchOptions {
  after?: Date;
  before?: Date;
}

export interface MatchSummary {
  activitiesEvaluated: number;
  rulesConsidered: number;
  candidatesAttempted: number;
  attendancesCreated: number;
}

@Injectable()
export class AttendanceMatcherService {
  constructor(private readonly prisma: PrismaService) {}

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
      orderBy: { startedAt: "asc" },
    });
    if (activities.length === 0) {
      return { activitiesEvaluated: 0, rulesConsidered: 0, candidatesAttempted: 0, attendancesCreated: 0 };
    }

    const minStart = activities[0]!.startedAt;
    const maxStart = activities[activities.length - 1]!.startedAt;

    const rules = await this.prisma.eventSyncRule.findMany({
      where: {
        provider: SyncProvider.strava,
        windowEndsAt: { gte: minStart },
        windowStartsAt: { lte: maxStart },
      },
      orderBy: [{ windowStartsAt: "asc" }, { eventId: "asc" }],
    });

    const candidates: Prisma.EventAttendanceCreateManyInput[] = [];

    for (const activity of activities) {
      for (const rule of rules) {
        if (!this.ruleMatchesActivity(rule, activity)) continue;
        const status = rule.autoApprove ? AttendanceStatus.approved : AttendanceStatus.pending;
        const now = new Date();
        candidates.push({
          eventId: rule.eventId,
          userId,
          externalActivityId: activity.id,
          source: AttendanceSource.sync,
          status,
          matchedAt: now,
          reviewedAt: rule.autoApprove ? now : null,
        });
      }
    }

    const result = await this.prisma.eventAttendance.createMany({
      data: candidates,
      skipDuplicates: true,
    });

    return {
      activitiesEvaluated: activities.length,
      rulesConsidered: rules.length,
      candidatesAttempted: candidates.length,
      attendancesCreated: result.count,
    };
  }

  ruleMatchesActivity(rule: EventSyncRule, activity: ExternalActivity): boolean {
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

    if (rule.geofenceLat != null && rule.geofenceLng != null && rule.geofenceRadiusMeters != null) {
      if (!passesGeofence(rule, activity)) return false;
    }

    return true;
  }
}

function passesGeofence(rule: EventSyncRule, activity: ExternalActivity): boolean {
  const lat = rule.geofenceLat!;
  const lng = rule.geofenceLng!;
  const radius = rule.geofenceRadiusMeters!;

  const points: Array<[number, number]> = [];
  if (activity.startLat != null && activity.startLng != null) {
    points.push([activity.startLat, activity.startLng]);
  }
  if (activity.endLat != null && activity.endLng != null) {
    points.push([activity.endLat, activity.endLng]);
  }
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
