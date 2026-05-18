import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLocationDto } from "./dto/create-location.dto";
import { ListLocationsQuery } from "./dto/list-locations.query";
import { UpdateLocationDto } from "./dto/update-location.dto";
import { UpsertPaceGroupDto } from "./dto/upsert-pace-group.dto";

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
    const slug = await this.resolveSlug(dto.slug, dto.name);
    try {
      return await this.prisma.cityLocation.create({
        data: {
          name: dto.name,
          slug,
          city: dto.city,
          venue: dto.venue ?? null,
          address: dto.address ?? null,
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

  /** Derive a unique slug from `name` when admin didn't supply one. */
  private async resolveSlug(
    provided: string | undefined,
    name: string,
  ): Promise<string> {
    if (provided && provided.length > 0) return provided;
    const base = slugifyName(name);
    if (!base) {
      throw new BadRequestException({ code: "LOCATION_SLUG_DERIVATION_FAILED" });
    }
    let candidate = base;
    for (let i = 2; i < 100; i += 1) {
      const taken = await this.prisma.cityLocation.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!taken) return candidate;
      candidate = `${base}-${i}`;
    }
    throw new ConflictException({ code: "LOCATION_SLUG_TAKEN" });
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
          venue: dto.venue,
          address: dto.address,
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

  // -- pace groups --

  listPaceGroups(locationId: string) {
    return this.prisma.locationPaceGroup.findMany({
      where: { locationId },
      orderBy: [{ distanceKm: "asc" }, { paceSecondsPerKm: "asc" }],
    });
  }

  async addPaceGroup(locationId: string, dto: UpsertPaceGroupDto) {
    const loc = await this.prisma.cityLocation.findUnique({ where: { id: locationId } });
    if (!loc) throw new NotFoundException({ code: "LOCATION_NOT_FOUND" });
    try {
      return await this.prisma.locationPaceGroup.create({
        data: {
          locationId,
          distanceKm: dto.distanceKm,
          paceSecondsPerKm: dto.paceSecondsPerKm,
          pacerName: dto.pacerName ?? null,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException({ code: "PACE_GROUP_DUPLICATE" });
      }
      throw err;
    }
  }

  async deletePaceGroup(locationId: string, paceGroupId: string) {
    const row = await this.prisma.locationPaceGroup.findUnique({
      where: { id: paceGroupId },
    });
    if (!row || row.locationId !== locationId) {
      throw new NotFoundException({ code: "PACE_GROUP_NOT_FOUND" });
    }
    await this.prisma.locationPaceGroup.delete({ where: { id: paceGroupId } });
    return { ok: true };
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

/** Cyrillic → ASCII transliteration + hyphenation (matches the Event slug
 *  derivation in events.service.ts). Caps at 200 chars. */
const CYRILLIC_TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z",
  и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh",
  щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};
function slugifyName(name: string): string {
  const lower = name.toLowerCase();
  let out = "";
  for (const ch of lower) {
    const tr = CYRILLIC_TRANSLIT[ch];
    if (tr !== undefined) out += tr;
    else if (/[a-z0-9]/.test(ch)) out += ch;
    else out += "-";
  }
  return out.replace(/-+/g, "-").replace(/^-+|-+$/g, "").slice(0, 200);
}
