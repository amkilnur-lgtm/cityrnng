import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { SyncProvider } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UpsertSyncRuleDto } from "./dto/upsert-sync-rule.dto";

@Injectable()
export class SyncRulesService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertForEvent(eventId: string, dto: UpsertSyncRuleDto) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });

    const windowStartsAt = new Date(dto.windowStartsAt);
    const windowEndsAt = new Date(dto.windowEndsAt);
    if (windowStartsAt.getTime() >= windowEndsAt.getTime()) {
      throw new BadRequestException({ code: "SYNC_RULE_INVALID_WINDOW" });
    }
    assertOptionalRange(dto.minDistanceMeters, dto.maxDistanceMeters, "DISTANCE");
    assertOptionalRange(dto.minDurationSeconds, dto.maxDurationSeconds, "DURATION");
    assertGeofence(dto);

    const data = {
      provider: dto.provider ?? SyncProvider.strava,
      activityType: dto.activityType ?? null,
      minDistanceMeters: dto.minDistanceMeters ?? null,
      maxDistanceMeters: dto.maxDistanceMeters ?? null,
      minDurationSeconds: dto.minDurationSeconds ?? null,
      maxDurationSeconds: dto.maxDurationSeconds ?? null,
      windowStartsAt,
      windowEndsAt,
      geofenceLat: dto.geofenceLat ?? null,
      geofenceLng: dto.geofenceLng ?? null,
      geofenceRadiusMeters: dto.geofenceRadiusMeters ?? null,
      autoApprove: dto.autoApprove ?? false,
    };

    return this.prisma.eventSyncRule.upsert({
      where: { eventId },
      create: { eventId, ...data },
      update: data,
    });
  }
}

function assertOptionalRange(min: number | undefined, max: number | undefined, label: string) {
  if (min != null && max != null && min > max) {
    throw new BadRequestException({ code: `SYNC_RULE_INVALID_${label}_RANGE` });
  }
}

function assertGeofence(dto: UpsertSyncRuleDto) {
  const provided = [dto.geofenceLat, dto.geofenceLng, dto.geofenceRadiusMeters].filter(
    (v) => v != null,
  ).length;
  if (provided > 0 && provided !== 3) {
    throw new BadRequestException({ code: "SYNC_RULE_INCOMPLETE_GEOFENCE" });
  }
}
