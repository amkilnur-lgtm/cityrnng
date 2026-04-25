import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PartnerStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePartnerDto } from "./dto/create-partner.dto";
import { UpdatePartnerDto } from "./dto/update-partner.dto";

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  list(opts: { status?: PartnerStatus } = {}) {
    return this.prisma.partner.findMany({
      where: { status: opts.status },
      orderBy: { name: "asc" },
    });
  }

  async getByIdOrThrow(id: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException({ code: "PARTNER_NOT_FOUND" });
    return partner;
  }

  async getBySlugOrThrow(slug: string) {
    const partner = await this.prisma.partner.findUnique({ where: { slug } });
    if (!partner) throw new NotFoundException({ code: "PARTNER_NOT_FOUND" });
    return partner;
  }

  async create(dto: CreatePartnerDto, createdById: string) {
    try {
      return await this.prisma.partner.create({
        data: {
          slug: dto.slug,
          name: dto.name,
          description: dto.description,
          contactEmail: dto.contactEmail,
          status: dto.status ?? PartnerStatus.active,
          createdById,
        },
      });
    } catch (err) {
      if (isUniqueViolation(err, "slug")) {
        throw new ConflictException({ code: "PARTNER_SLUG_TAKEN" });
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdatePartnerDto) {
    await this.getByIdOrThrow(id);
    try {
      return await this.prisma.partner.update({
        where: { id },
        data: {
          slug: dto.slug,
          name: dto.name,
          description: dto.description,
          contactEmail: dto.contactEmail,
          status: dto.status,
        },
      });
    } catch (err) {
      if (isUniqueViolation(err, "slug")) {
        throw new ConflictException({ code: "PARTNER_SLUG_TAKEN" });
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
