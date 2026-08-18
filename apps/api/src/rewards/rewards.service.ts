import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  PartnerStatus,
  Prisma,
  PromoCodeStatus,
  RewardStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRewardDto } from "./dto/create-reward.dto";
import { UpdateRewardDto } from "./dto/update-reward.dto";

@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public catalog — only active rewards from active partners. */
  listPublic(opts: { partnerSlug?: string } = {}) {
    const where: Prisma.RewardWhereInput = {
      status: RewardStatus.active,
      partner: { status: PartnerStatus.active },
    };
    if (opts.partnerSlug) {
      where.partner = { ...(where.partner as object), slug: opts.partnerSlug };
    }
    return this.prisma.reward.findMany({
      where,
      include: { partner: true },
      orderBy: [{ partner: { name: "asc" } }, { costPoints: "asc" }],
    });
  }

  /** Admin list — all statuses, all partners. */
  listAdmin(opts: { partnerId?: string } = {}) {
    return this.prisma.reward.findMany({
      where: { partnerId: opts.partnerId },
      include: { partner: true },
      orderBy: [{ partner: { name: "asc" } }, { title: "asc" }],
    });
  }

  async getPublicBySlugOrThrow(slug: string) {
    const reward = await this.prisma.reward.findUnique({
      where: { slug },
      include: { partner: true },
    });
    if (!reward) throw new NotFoundException({ code: "REWARD_NOT_FOUND" });
    if (reward.status !== RewardStatus.active) {
      throw new NotFoundException({ code: "REWARD_NOT_FOUND" });
    }
    if (reward.partner.status !== PartnerStatus.active) {
      throw new NotFoundException({ code: "REWARD_NOT_FOUND" });
    }
    return reward;
  }

  async getByIdOrThrow(id: string) {
    const reward = await this.prisma.reward.findUnique({
      where: { id },
      include: { partner: true },
    });
    if (!reward) throw new NotFoundException({ code: "REWARD_NOT_FOUND" });
    return reward;
  }

  async create(dto: CreateRewardDto, createdById: string) {
    assertValidityRange(dto.validFrom, dto.validUntil);
    try {
      return await this.prisma.reward.create({
        data: {
          slug: dto.slug,
          partnerId: dto.partnerId,
          title: dto.title,
          description: dto.description,
          costPoints: dto.costPoints,
          badge: dto.badge,
          status: dto.status ?? RewardStatus.active,
          fulfillmentType: dto.fulfillmentType,
          validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
          capacity: dto.capacity,
          createdById,
        },
        include: { partner: true },
      });
    } catch (err) {
      if (isUniqueViolation(err, "slug")) {
        throw new ConflictException({ code: "REWARD_SLUG_TAKEN" });
      }
      if (isFkViolation(err)) {
        throw new BadRequestException({ code: "REWARD_PARTNER_INVALID" });
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateRewardDto) {
    const existing = await this.getByIdOrThrow(id);
    const validFrom = dto.validFrom ? new Date(dto.validFrom) : existing.validFrom;
    const validUntil = dto.validUntil
      ? new Date(dto.validUntil)
      : existing.validUntil;
    if (validFrom && validUntil && validFrom > validUntil) {
      throw new BadRequestException({ code: "REWARD_INVALID_VALIDITY_RANGE" });
    }
    try {
      return await this.prisma.reward.update({
        where: { id },
        data: {
          slug: dto.slug,
          partnerId: dto.partnerId,
          title: dto.title,
          description: dto.description,
          costPoints: dto.costPoints,
          badge: dto.badge,
          status: dto.status,
          fulfillmentType: dto.fulfillmentType,
          validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
          capacity: dto.capacity,
        },
        include: { partner: true },
      });
    } catch (err) {
      if (isUniqueViolation(err, "slug")) {
        throw new ConflictException({ code: "REWARD_SLUG_TAKEN" });
      }
      throw err;
    }
  }

  /** Pool stats for a promo_pool reward. */
  async promoStats(rewardId: string) {
    await this.getByIdOrThrow(rewardId);
    const [available, assigned] = await Promise.all([
      this.prisma.promoCode.count({
        where: { rewardId, status: PromoCodeStatus.available },
      }),
      this.prisma.promoCode.count({
        where: { rewardId, status: PromoCodeStatus.assigned },
      }),
    ]);
    return { available, assigned, total: available + assigned };
  }

  /**
   * Bulk-load partner promo codes into a reward's pool. Codes are trimmed,
   * de-duplicated within the batch, and inserted skipping any already present
   * (unique on [rewardId, code]) — safe to re-paste a partly-loaded list.
   */
  async addPromoCodes(rewardId: string, rawCodes: string[]) {
    await this.getByIdOrThrow(rewardId);
    const codes = [
      ...new Set(rawCodes.map((c) => c.trim()).filter((c) => c.length > 0)),
    ];
    if (codes.length === 0) {
      throw new BadRequestException({ code: "PROMO_CODES_EMPTY" });
    }
    const result = await this.prisma.promoCode.createMany({
      data: codes.map((code) => ({ rewardId, code })),
      skipDuplicates: true,
    });
    const stats = await this.promoStats(rewardId);
    return { added: result.count, skipped: codes.length - result.count, ...stats };
  }
}

function assertValidityRange(from?: string, until?: string) {
  if (from && until && new Date(from) > new Date(until)) {
    throw new BadRequestException({ code: "REWARD_INVALID_VALIDITY_RANGE" });
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

function isFkViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003"
  );
}
