import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLocationDto } from "./dto/create-location.dto";
import { ListLocationsQuery } from "./dto/list-locations.query";
import { UpdateLocationDto } from "./dto/update-location.dto";

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: ListLocationsQuery) {
    return this.prisma.cityLocation.findMany({
      where: {
        city: query.city ? { equals: query.city, mode: "insensitive" } : undefined,
        status: query.status,
      },
      orderBy: [{ city: "asc" }, { name: "asc" }],
    });
  }

  async create(dto: CreateLocationDto) {
    try {
      return await this.prisma.cityLocation.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          city: dto.city,
          lat: dto.lat,
          lng: dto.lng,
          radiusMeters: dto.radiusMeters,
          status: dto.status,
        },
      });
    } catch (err) {
      if (isUniqueViolation(err, "slug")) {
        throw new ConflictException({ code: "LOCATION_SLUG_TAKEN" });
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateLocationDto) {
    const existing = await this.prisma.cityLocation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException({ code: "LOCATION_NOT_FOUND" });
    try {
      return await this.prisma.cityLocation.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.slug,
          city: dto.city,
          lat: dto.lat,
          lng: dto.lng,
          radiusMeters: dto.radiusMeters,
          status: dto.status,
        },
      });
    } catch (err) {
      if (isUniqueViolation(err, "slug")) {
        throw new ConflictException({ code: "LOCATION_SLUG_TAKEN" });
      }
      throw err;
    }
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
