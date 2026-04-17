import { ConflictException, Injectable } from "@nestjs/common";
import {
  PointActorType,
  PointDirection,
  PointReasonType,
  PointTransaction,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface PostParams {
  userId: string;
  direction: PointDirection;
  amount: number;
  reasonType: PointReasonType;
  idempotencyKey: string;
  reasonRef?: string | null;
  comment?: string | null;
  actor: { type: PointActorType; id?: string | null };
}

export interface HistoryQuery {
  limit?: number;
  cursor?: string;
}

@Injectable()
export class PointsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Canonical ledger writer. Idempotent on idempotencyKey. */
  async post(params: PostParams, tx?: Prisma.TransactionClient): Promise<PointTransaction> {
    if (!Number.isInteger(params.amount) || params.amount <= 0) {
      throw new Error(`Invalid point amount: ${params.amount}`);
    }

    const run = async (client: Prisma.TransactionClient) => {
      const existing = await client.pointTransaction.findUnique({
        where: { idempotencyKey: params.idempotencyKey },
      });
      if (existing) return existing;

      const account = await client.pointAccount.upsert({
        where: { userId: params.userId },
        create: { userId: params.userId },
        update: {},
      });
      if (account.status !== "active") {
        throw new ConflictException({ code: "POINTS_ACCOUNT_BLOCKED" });
      }

      const signed = params.direction === PointDirection.credit ? params.amount : -params.amount;
      const updatedAccount = await client.pointAccount.update({
        where: { id: account.id },
        data: { balance: { increment: signed } },
      });

      try {
        return await client.pointTransaction.create({
          data: {
            accountId: account.id,
            userId: params.userId,
            direction: params.direction,
            amount: params.amount,
            balanceAfter: updatedAccount.balance,
            reasonType: params.reasonType,
            reasonRef: params.reasonRef ?? null,
            idempotencyKey: params.idempotencyKey,
            comment: params.comment ?? null,
            createdByType: params.actor.type,
            createdById: params.actor.id ?? null,
          },
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002" &&
          uniqueTargetIncludes(err, "idempotency_key")
        ) {
          const winner = await client.pointTransaction.findUnique({
            where: { idempotencyKey: params.idempotencyKey },
          });
          if (winner) return winner;
        }
        throw err;
      }
    };

    if (tx) return run(tx);
    return this.prisma.$transaction(run, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async getBalance(userId: string): Promise<number> {
    const account = await this.prisma.pointAccount.findUnique({ where: { userId } });
    return account?.balance ?? 0;
  }

  async listHistory(userId: string, query: HistoryQuery = {}) {
    const take = Math.min(100, Math.max(1, query.limit ?? 20));
    const args: Prisma.PointTransactionFindManyArgs = {
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
    };
    if (query.cursor) {
      args.cursor = { id: query.cursor };
      args.skip = 1;
    }
    const rows = await this.prisma.pointTransaction.findMany(args);
    const nextCursor = rows.length > take ? rows[take - 1]!.id : null;
    const page = rows.slice(0, take);
    return {
      items: page.map((t) => ({
        id: t.id,
        direction: t.direction,
        amount: t.amount,
        balanceAfter: t.balanceAfter,
        reasonType: t.reasonType,
        reasonRef: t.reasonRef,
        comment: t.comment,
        createdAt: t.createdAt,
      })),
      nextCursor,
    };
  }
}

function uniqueTargetIncludes(err: Prisma.PrismaClientKnownRequestError, field: string): boolean {
  const target = err.meta?.target;
  if (Array.isArray(target)) return target.includes(field);
  if (typeof target === "string") return target.includes(field);
  return false;
}
