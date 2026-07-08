import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ROLE_ADMIN, ROLE_RUNNER } from "../auth/types";
import { CryptoService } from "../crypto/crypto.service";
import { PointsAwardsService } from "../points/points-awards.service";
import { generateCheckinCode } from "./checkin-code";

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
    private readonly crypto: CryptoService,
  ) {}

  async findByIdWithRelations(id: string): Promise<UserWithRelations | null> {
    // Lazy backfill: accounts predating the QR feature (or password logins /
    // long-lived sessions, which never pass through ensureFromVerifiedEmail)
    // get their check-in code on the next /me read.
    await this.prisma.user.updateMany({
      where: { id, checkinCode: null },
      data: { checkinCode: generateCheckinCode() },
    });
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
        : await tx.user.create({
            data: { email, status: "active", checkinCode: generateCheckinCode() },
          });

      // Backfill the QR check-in code for users created before this feature
      // (or any row that somehow lacks one) on their next verified login.
      if (!user.checkinCode) {
        const updated = await tx.user.update({
          where: { id: user.id },
          data: { checkinCode: generateCheckinCode() },
        });
        user.checkinCode = updated.checkinCode;
      }

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
   * Create a new account with a password. Rejects an already-active email
   * (they should log in / reset instead) — never silently claims an existing
   * account. A leftover `pending` row (e.g. from an invite) is upgraded.
   */
  async registerWithPassword(input: {
    email: string;
    password: string;
    name: string;
  }): Promise<UserWithRelations> {
    const passwordHash = this.crypto.hashPassword(input.password);
    const displayName = input.name.trim() || defaultDisplayName(input.email);
    return this.prisma.$transaction(async (tx) => {
      const runnerRole = await tx.role.upsert({
        where: { code: ROLE_RUNNER },
        update: {},
        create: { code: ROLE_RUNNER, name: "Runner" },
      });

      const existing = await tx.user.findUnique({ where: { email: input.email } });
      if (existing && existing.status === "active") {
        throw new ConflictException({ code: "EMAIL_TAKEN" });
      }

      const user = existing
        ? await tx.user.update({
            where: { id: existing.id },
            data: {
              status: "active",
              passwordHash,
              checkinCode: existing.checkinCode ?? generateCheckinCode(),
            },
          })
        : await tx.user.create({
            data: {
              email: input.email,
              status: "active",
              passwordHash,
              checkinCode: generateCheckinCode(),
            },
          });

      await tx.profile.upsert({
        where: { userId: user.id },
        update: { displayName },
        create: { userId: user.id, displayName },
      });
      await tx.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: runnerRole.id } },
        update: {},
        create: { userId: user.id, roleId: runnerRole.id },
      });
      // First activation → welcome bonus (idempotent per user in the ledger).
      await this.pointsAwards.awardSignupBonus(user.id, tx);

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: { profile: true, roles: { include: { role: true } } },
      });
    });
  }

  /** Lookup for password login — includes the hash, profile and roles. */
  findByEmailForAuth(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { profile: true, roles: { include: { role: true } } },
    });
  }

  /**
   * Set or change the caller's password. If one is already set, the current
   * password must be supplied and match.
   */
  async setPassword(
    userId: string,
    input: { currentPassword?: string; newPassword: string },
  ): Promise<{ ok: true }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND" });
    if (user.passwordHash) {
      if (!input.currentPassword) {
        throw new BadRequestException({ code: "CURRENT_PASSWORD_REQUIRED" });
      }
      if (!this.crypto.verifyPassword(input.currentPassword, user.passwordHash)) {
        throw new BadRequestException({ code: "CURRENT_PASSWORD_WRONG" });
      }
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: this.crypto.hashPassword(input.newPassword) },
    });
    return { ok: true };
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

  /**
   * Admin-side: find a user by email or create a pending shell. Creates the
   * default `runner` role + a minimal profile so the user can later activate
   * via the normal magic-link flow (`ensureFromVerifiedEmail` flips
   * pending→active and awards the signup bonus on first verified login).
   *
   * Does NOT award signup bonus or send any email — caller is admin, the
   * user hasn't verified anything yet.
   */
  async findOrCreatePending(email: string): Promise<UserWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      const runnerRole = await tx.role.upsert({
        where: { code: ROLE_RUNNER },
        update: {},
        create: { code: ROLE_RUNNER, name: "Runner" },
      });

      const existing = await tx.user.findUnique({ where: { email } });
      const user: User = existing
        ? existing
        : await tx.user.create({ data: { email, status: "pending" } });

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

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: { profile: true, roles: { include: { role: true } } },
      });
    });
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
