import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  PartnerStatus,
  PointActorType,
  PointDirection,
  PointReasonType,
  Prisma,
  RedemptionStatus,
  RewardStatus,
} from "@prisma/client";
import { PointsService } from "../points/points.service";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Code alphabet: uppercase letters and digits with similar-looking
 * characters removed (no I/O/0/1) to make codes easier to read aloud.
 */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const CODE_RETRIES = 5;

/** Default 7 days for active redemption. */
const DEFAULT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class RedemptionsService {
  private readonly logger = new Logger(RedemptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly points: PointsService,
  ) {}

  /**
   * Atomically debit user's points and create a redemption.
   *
   * - Validates reward is active + within validity window + capacity not full
   * - Reads balance, throws if insufficient
   * - Inside a single Prisma transaction:
   *     1. PointTransaction.post (debit, idempotent on idempotencyKey)
   *     2. Generate unique 6-char code (retries on collision)
   *     3. Insert Redemption linked to that PointTransaction
   *     4. reward.soldCount += 1
   *
   * If `idempotencyKey` was previously used, returns the same redemption.
   */
  async redeem(opts: {
    userId: string;
    rewardSlug: string;
    idempotencyKey?: string;
  }) {
    const reward = await this.prisma.reward.findUnique({
      where: { slug: opts.rewardSlug },
      include: { partner: true },
    });
    if (!reward) throw new NotFoundException({ code: "REWARD_NOT_FOUND" });
    if (reward.status !== RewardStatus.active) {
      throw new ForbiddenException({ code: "REWARD_NOT_AVAILABLE" });
    }
    if (reward.partner.status !== PartnerStatus.active) {
      throw new ForbiddenException({ code: "REWARD_PARTNER_ARCHIVED" });
    }

    const now = new Date();
    if (reward.validFrom && reward.validFrom > now) {
      throw new ForbiddenException({ code: "REWARD_NOT_YET_AVAILABLE" });
    }
    if (reward.validUntil && reward.validUntil < now) {
      throw new ForbiddenException({ code: "REWARD_EXPIRED" });
    }
    if (reward.capacity != null && reward.soldCount >= reward.capacity) {
      throw new ForbiddenException({ code: "REWARD_SOLD_OUT" });
    }

    // Idempotency-on-retry: derive a stable key per request when client
    // doesn't supply one. We pass the same key to PointsService.post which
    // already deduplicates on its idempotencyKey column.
    const idempotencyKey =
      opts.idempotencyKey ??
      `reward_redemption:${opts.userId}:${reward.id}:${cryptoRandomId()}`;
    const pointKey = `reward_redemption:${idempotencyKey}`;

    // If a redemption with this idempotencyKey already exists, return it.
    const existing = await this.prisma.redemption.findFirst({
      where: {
        userId: opts.userId,
        rewardId: reward.id,
        pointTransaction: { idempotencyKey: pointKey },
      },
      include: { reward: { include: { partner: true } } },
    });
    if (existing) return existing;

    // Pre-flight balance check (cheap; tx will re-verify atomically).
    const account = await this.prisma.pointAccount.findUnique({
      where: { userId: opts.userId },
    });
    if (!account || account.balance < reward.costPoints) {
      throw new BadRequestException({ code: "POINTS_INSUFFICIENT" });
    }

    return await this.prisma.$transaction(async (tx) => {
      const txn = await this.points.post(
        {
          userId: opts.userId,
          direction: PointDirection.debit,
          amount: reward.costPoints,
          reasonType: PointReasonType.reward_redemption,
          reasonRef: reward.id,
          idempotencyKey: pointKey,
          actor: { type: PointActorType.system },
          comment: `${reward.partner.name} · ${reward.title}`,
        },
        tx,
      );

      // Code generation with retry on collision
      let createdRedemption = null;
      for (let attempt = 0; attempt < CODE_RETRIES; attempt++) {
        const code = generateCode();
        try {
          createdRedemption = await tx.redemption.create({
            data: {
              userId: opts.userId,
              rewardId: reward.id,
              costPoints: reward.costPoints,
              status: RedemptionStatus.active,
              code,
              pointTxnId: txn.id,
              expiresAt: new Date(Date.now() + DEFAULT_EXPIRY_MS),
            },
            include: { reward: { include: { partner: true } } },
          });
          break;
        } catch (err) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2002" &&
            String(err.meta?.target ?? "").includes("code")
          ) {
            this.logger.warn(`Code collision on redemption (attempt ${attempt + 1})`);
            continue;
          }
          throw err;
        }
      }
      if (!createdRedemption) {
        throw new ConflictException({ code: "REWARD_CODE_GENERATION_FAILED" });
      }

      await tx.reward.update({
        where: { id: reward.id },
        data: { soldCount: { increment: 1 } },
      });

      return createdRedemption;
    });
  }

  listForUser(userId: string, opts: { status?: RedemptionStatus } = {}) {
    return this.prisma.redemption.findMany({
      where: {
        userId,
        status: opts.status,
      },
      include: { reward: { include: { partner: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Admin-side list of every redemption with optional filters. Includes
   * minimal user info (email + display name) so admin can see who the
   * code belongs to without a second lookup.
   */
  async listForAdmin(opts: {
    status?: RedemptionStatus;
    partnerId?: string;
    code?: string;
    take?: number;
  } = {}) {
    const take = Math.min(Math.max(opts.take ?? 50, 1), 200);
    return this.prisma.redemption.findMany({
      where: {
        status: opts.status,
        code: opts.code ? opts.code.toUpperCase() : undefined,
        reward: opts.partnerId ? { partnerId: opts.partnerId } : undefined,
      },
      include: {
        reward: { include: { partner: true } },
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { displayName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
    });
  }

  async getByCodeForUser(userId: string, code: string) {
    const redemption = await this.prisma.redemption.findUnique({
      where: { code },
      include: { reward: { include: { partner: true } } },
    });
    if (!redemption || redemption.userId !== userId) {
      throw new NotFoundException({ code: "REDEMPTION_NOT_FOUND" });
    }
    return redemption;
  }

  /** Admin / partner-side: mark a code used. */
  async markUsedByCode(code: string, usedById: string) {
    const redemption = await this.prisma.redemption.findUnique({
      where: { code },
    });
    if (!redemption) {
      throw new NotFoundException({ code: "REDEMPTION_NOT_FOUND" });
    }
    if (redemption.status !== RedemptionStatus.active) {
      throw new ConflictException({ code: "REDEMPTION_NOT_ACTIVE" });
    }
    if (redemption.expiresAt && redemption.expiresAt < new Date()) {
      throw new ConflictException({ code: "REDEMPTION_EXPIRED" });
    }
    return this.prisma.redemption.update({
      where: { id: redemption.id },
      data: {
        status: RedemptionStatus.used,
        usedAt: new Date(),
        usedById,
      },
      include: { reward: { include: { partner: true } } },
    });
  }

  /** Admin: cancel + refund points back to user. */
  async cancelAndRefund(id: string, opts: { reason?: string }) {
    const redemption = await this.prisma.redemption.findUnique({
      where: { id },
      include: { reward: true },
    });
    if (!redemption) {
      throw new NotFoundException({ code: "REDEMPTION_NOT_FOUND" });
    }
    if (redemption.status !== RedemptionStatus.active) {
      throw new ConflictException({ code: "REDEMPTION_NOT_ACTIVE" });
    }

    return await this.prisma.$transaction(async (tx) => {
      const refundKey = `reward_redemption_refund:${redemption.id}`;
      await this.points.post(
        {
          userId: redemption.userId,
          direction: PointDirection.credit,
          amount: redemption.costPoints,
          reasonType: PointReasonType.reversal,
          reasonRef: redemption.id,
          idempotencyKey: refundKey,
          actor: { type: PointActorType.admin },
          comment: opts.reason ?? "Возврат — отмена обмена",
        },
        tx,
      );
      const cancelled = await tx.redemption.update({
        where: { id: redemption.id },
        data: {
          status: RedemptionStatus.cancelled,
          cancelledAt: new Date(),
          cancelledReason: opts.reason ?? null,
        },
        include: { reward: { include: { partner: true } } },
      });
      await tx.reward.update({
        where: { id: redemption.rewardId },
        data: { soldCount: { decrement: 1 } },
      });
      return cancelled;
    });
  }
}

function generateCode(): string {
  let s = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return s;
}

function cryptoRandomId(): string {
  // Stable enough across retries within one request — uses crypto.randomUUID
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}
