import { Injectable } from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ROLE_RUNNER } from "../auth/types";
import { PointsAwardsService } from "../points/points-awards.service";

export type UserWithRelations = Prisma.UserGetPayload<{
  include: { profile: true; roles: { include: { role: true } } };
}>;

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
}

function defaultDisplayName(email: string): string {
  const local = email.split("@")[0] ?? "runner";
  return local.length > 0 ? local : "runner";
}

export function rolesOf(user: UserWithRelations): string[] {
  return user.roles.map((r) => r.role.code);
}
