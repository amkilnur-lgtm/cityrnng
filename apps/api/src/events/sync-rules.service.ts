import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CityLocationStatus, SyncProvider } from "@prisma/client";
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

    const locationIds = dto.locationIds ?? [];
    if (locationIds.length > 0) {
      const found = await this.prisma.cityLocation.findMany({
        where: { id: { in: locationIds } },
        select: { id: true, status: true },
      });
      if (found.length !== locationIds.length) {
        throw new BadRequestException({ code: "SYNC_RULE_LOCATION_NOT_FOUND" });
      }
      const archived = found.filter((l) => l.status !== CityLocationStatus.active);
      if (archived.length > 0) {
        throw new BadRequestException({ code: "SYNC_RULE_LOCATION_ARCHIVED" });
      }
    }

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

    return this.prisma.$transaction(async (tx) => {
      const rule = await tx.eventSyncRule.upsert({
        where: { eventId },
        create: { eventId, ...data },
        update: data,
      });

      if (dto.locationIds !== undefined) {
        await tx.eventSyncRuleLocation.deleteMany({ where: { syncRuleId: rule.id } });
        if (locationIds.length > 0) {
          await tx.eventSyncRuleLocation.createMany({
            data: locationIds.map((locationId) => ({ syncRuleId: rule.id, locationId })),
          });
        }
      }

      return tx.eventSyncRule.findUniqueOrThrow({
        where: { id: rule.id },
        include: { locations: { include: { location: true } } },
      });
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
