import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ROLE_ADMIN, ROLE_RUNNER } from "../auth/types";
import { PointsAwardsService } from "../points/points-awards.service";

export type UserWithRelations = Prisma.UserGetPayload<{
  include: { profile: true; roles: { include: { role: true } } };
}>;

export type AdminUserRow = UserWithRelations & {
  pointAccount: { balance: number } | null;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsAwards: PointsAwardsService,
  ) {}

  async findByIdWithRelations(id: string): Promise<UserWithRelations | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { profile: true, roles: { include: { role: true } } },
    });
  }

  async ensureFromVerifiedEmail(email: string): Promise<UserWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      const runnerRole = await tx.role.upsert({
        where: { code: ROLE_RUNNER },
        update: {},
        create: { code: ROLE_RUNNER, name: "Runner" },
      });

      const existing = await tx.user.findUnique({ where: { email } });
      const isFirstActivation = !existing || existing.status === "pending";
      const user: User = existing
        ? existing.status === "pending"
          ? await tx.user.update({ where: { id: existing.id }, data: { status: "active" } })
          : existing
        : await tx.user.create({ data: { email, status: "active" } });

      await tx.profile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, displayName: defaultDisplayName(email) },
      });

      await tx.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: runnerRole.id } },
        update: {},
        create: { userId: user.id, roleId: runnerRole.id },
      });

      if (isFirstActivation) {
        await this.pointsAwards.awardSignupBonus(user.id, tx);
      }

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: { profile: true, roles: { include: { role: true } } },
      });
    });
  }

  /**
   * Self-service profile patch. `undefined` fields are skipped (partial
   * update). Caller is the authenticated user — guard happens at the
   * controller / global JwtAuthGuard.
   */
  async updateProfile(
    userId: string,
    patch: {
      displayName?: string;
      firstName?: string | null;
      lastName?: string | null;
      city?: string | null;
      telegramHandle?: string | null;
      instagramHandle?: string | null;
    },
  ): Promise<UserWithRelations> {
    // Drop undefined keys so Prisma doesn't write them.
    const data = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined),
    );

    if (Object.keys(data).length > 0) {
      const existing = await this.prisma.profile.findUnique({
        where: { userId },
      });
      if (existing) {
        await this.prisma.profile.update({ where: { userId }, data });
      } else {
        // Defensive — should never hit, ensureFromVerifiedEmail always creates one.
        await this.prisma.profile.create({
          data: {
            userId,
            displayName: data.displayName ?? "runner",
            firstName: data.firstName ?? null,
            lastName: data.lastName ?? null,
            city: data.city ?? null,
            telegramHandle: data.telegramHandle ?? null,
            instagramHandle: data.instagramHandle ?? null,
          },
        });
      }
    }

    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profile: true, roles: { include: { role: true } } },
    });
  }

  /** Admin listing — paginated by createdAt desc with profile + roles + balance. */
  async listAdmin(opts: { limit?: number; cursor?: string } = {}): Promise<{
    rows: AdminUserRow[];
    nextCursor: string | null;
  }> {
    const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
    const rows = await this.prisma.user.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      cursor: opts.cursor ? { id: opts.cursor } : undefined,
      skip: opts.cursor ? 1 : 0,
      include: {
        profile: true,
        roles: { include: { role: true } },
        pointAccount: { select: { balance: true } },
      },
    });
    const hasMore = rows.length > limit;
    const trimmed = hasMore ? rows.slice(0, limit) : rows;
    return {
      rows: trimmed,
      nextCursor: hasMore ? rows[limit - 1].id : null,
    };
  }

  /** Grant a role by code. Idempotent — granting an already-held role is a no-op. */
  async grantRole(userId: string, roleCode: string): Promise<UserWithRelations> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND" });
    const role = await this.prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) throw new NotFoundException({ code: "ROLE_NOT_FOUND" });

    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: { userId, roleId: role.id },
    });
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profile: true, roles: { include: { role: true } } },
    });
  }

  /**
   * Revoke a role by code. Refuses to revoke admin from the actor (to avoid
   * locking yourself out) and refuses to revoke runner (everyone keeps it).
   */
  async revokeRole(
    userId: string,
    roleCode: string,
    actorId: string,
  ): Promise<UserWithRelations> {
    if (roleCode === ROLE_RUNNER) {
      throw new ConflictException({ code: "CANNOT_REVOKE_RUNNER" });
    }
    if (roleCode === ROLE_ADMIN && userId === actorId) {
      throw new ConflictException({ code: "CANNOT_DEMOTE_SELF" });
    }
    const role = await this.prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) throw new NotFoundException({ code: "ROLE_NOT_FOUND" });

    await this.prisma.userRole.deleteMany({
      where: { userId, roleId: role.id },
    });
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profile: true, roles: { include: { role: true } } },
    });
  }
}

function defaultDisplayName(email: string): string {
  const local = email.split("@")[0] ?? "runner";
  return local.length > 0 ? local : "runner";
}

export function rolesOf(user: UserWithRelations): string[] {
  return user.roles.map((r) => r.role.code);
}
