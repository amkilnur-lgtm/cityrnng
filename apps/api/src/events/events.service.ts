import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CityLocationStatus, EventStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { ListEventsQuery } from "./dto/list-events.query";

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(query: ListEventsQuery) {
    const where: Prisma.EventWhereInput = {};
    where.status = query.status ?? EventStatus.published;
    if (query.type) where.type = query.type;
    if (query.from || query.to) {
      where.startsAt = {};
      if (query.from) where.startsAt.gte = new Date(query.from);
      if (query.to) where.startsAt.lte = new Date(query.to);
    }
    const rows = await this.prisma.event.findMany({
      where,
      orderBy: { startsAt: "asc" },
      include: { syncRule: { include: publicSyncRuleInclude.include } },
    });
    return rows.map(mapEventPublic);
  }

  async getByIdOrThrow(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { syncRule: { include: publicSyncRuleInclude.include } },
    });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    return mapEventPublic(event);
  }

  async getAdminByIdOrThrow(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    return event;
  }

  /** Admin listing — all statuses, ordered by startsAt desc (latest first). */
  listAdmin() {
    return this.prisma.event.findMany({
      orderBy: { startsAt: "desc" },
    });
  }

  async create(dto: CreateEventDto, createdById: string) {
    assertDateRange(dto.startsAt, dto.endsAt);
    try {
      return await this.prisma.event.create({
        data: {
          title: dto.title,
          slug: dto.slug,
          description: dto.description,
          type: dto.type,
          status: dto.status,
          startsAt: new Date(dto.startsAt),
          endsAt: new Date(dto.endsAt),
          locationName: dto.locationName,
          locationAddress: dto.locationAddress,
          locationLat: dto.locationLat,
          locationLng: dto.locationLng,
          capacity: dto.capacity,
          registrationOpenAt: dto.registrationOpenAt
            ? new Date(dto.registrationOpenAt)
            : null,
          registrationCloseAt: dto.registrationCloseAt
            ? new Date(dto.registrationCloseAt)
            : null,
          isPointsEligible: dto.isPointsEligible ?? false,
          basePointsAward: dto.basePointsAward ?? 0,
          createdById,
        },
      });
    } catch (err) {
      if (isUniqueViolation(err, "slug")) {
        throw new ConflictException({ code: "EVENT_SLUG_TAKEN" });
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateEventDto) {
    const existing = await this.getAdminByIdOrThrow(id);
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : existing.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : existing.endsAt;
    if (startsAt.getTime() >= endsAt.getTime()) {
      throw new BadRequestException({ code: "EVENT_INVALID_DATE_RANGE" });
    }
    try {
      return await this.prisma.event.update({
        where: { id },
        data: {
          title: dto.title,
          slug: dto.slug,
          description: dto.description,
          type: dto.type,
          status: dto.status,
          startsAt: dto.startsAt ? startsAt : undefined,
          endsAt: dto.endsAt ? endsAt : undefined,
          locationName: dto.locationName,
          locationAddress: dto.locationAddress,
          locationLat: dto.locationLat,
          locationLng: dto.locationLng,
          capacity: dto.capacity,
          registrationOpenAt: dto.registrationOpenAt
            ? new Date(dto.registrationOpenAt)
            : undefined,
          registrationCloseAt: dto.registrationCloseAt
            ? new Date(dto.registrationCloseAt)
            : undefined,
          isPointsEligible: dto.isPointsEligible,
          basePointsAward: dto.basePointsAward,
        },
      });
    } catch (err) {
      if (isUniqueViolation(err, "slug")) {
        throw new ConflictException({ code: "EVENT_SLUG_TAKEN" });
      }
      throw err;
    }
  }
}

function assertDateRange(startsAt: string, endsAt: string) {
  if (new Date(startsAt).getTime() >= new Date(endsAt).getTime()) {
    throw new BadRequestException({ code: "EVENT_INVALID_DATE_RANGE" });
  }
}

function isUniqueViolation(err: unknown, field: string): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (err.code !== "P2002") return false;
  const target = err.meta?.target;
  if (Array.isArray(target)) return target.includes(field);
  if (typeof target === "string") return target.includes(field);
  return false;
}

export const publicSyncRuleInclude = Prisma.validator<Prisma.EventSyncRuleDefaultArgs>()({
  include: {
    locations: {
      where: { location: { status: CityLocationStatus.active } },
      select: {
        location: {
          select: {
            id: true,
            name: true,
            city: true,
            lat: true,
            lng: true,
            radiusMeters: true,
            paceGroups: {
              orderBy: [{ distanceKm: "asc" }, { paceSecondsPerKm: "asc" }],
              select: {
                id: true,
                distanceKm: true,
                paceSecondsPerKm: true,
                pacerName: true,
              },
            },
          },
        },
      },
    },
  },
});

export type EventWithPublicSyncRule = Prisma.EventGetPayload<{
  include: {
    syncRule: typeof publicSyncRuleInclude;
  };
}>;

export function mapEventPublic(event: EventWithPublicSyncRule) {
  const { syncRule, ...rest } = event;
  if (!syncRule) return { ...rest, syncRule: null };
  const { locations, geofenceLat, geofenceLng, geofenceRadiusMeters, autoApprove, createdAt, updatedAt, ...publicRule } =
    syncRule;
  void geofenceLat;
  void geofenceLng;
  void geofenceRadiusMeters;
  void autoApprove;
  void createdAt;
  void updatedAt;
  return {
    ...rest,
    syncRule: {
      ...publicRule,
      locations: locations.map((l) => l.location),
    },
  };
}
