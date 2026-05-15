import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { ROLE_PARTNER } from "../auth/types";

@Injectable()
export class PartnerMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  /** List members of a partner with email + display name. */
  async listForPartner(partnerId: string) {
    await this.assertPartnerExists(partnerId);
    return this.prisma.partnerMember.findMany({
      where: { partnerId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            profile: { select: { displayName: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Add a user to a partner team by email. Find-or-create the user (pending
   * shell if they haven't logged in yet), grant the `partner` role, and
   * insert the membership row. Idempotent on the unique (partnerId, userId).
   */
  async addByEmail(partnerId: string, email: string, addedById: string) {
    await this.assertPartnerExists(partnerId);
    const normalized = email.trim().toLowerCase();
    const user = await this.users.findOrCreatePending(normalized);
    await this.users.grantRole(user.id, ROLE_PARTNER);

    await this.prisma.partnerMember.upsert({
      where: {
        partnerId_userId: { partnerId, userId: user.id },
      },
      update: {},
      create: {
        partnerId,
        userId: user.id,
        createdById: addedById,
      },
    });

    return this.listForPartner(partnerId);
  }

  /** Remove a member by membership id. Does NOT revoke the user's `partner` role. */
  async remove(partnerId: string, memberId: string) {
    const member = await this.prisma.partnerMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.partnerId !== partnerId) {
      throw new NotFoundException({ code: "PARTNER_MEMBER_NOT_FOUND" });
    }
    await this.prisma.partnerMember.delete({ where: { id: memberId } });
    return this.listForPartner(partnerId);
  }

  /** List partner ids a user is a member of (used by /partner verify). */
  listPartnersForUser(userId: string) {
    return this.prisma.partnerMember.findMany({
      where: { userId },
      include: { partner: true },
      orderBy: { createdAt: "asc" },
    });
  }

  private async assertPartnerExists(partnerId: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
      select: { id: true },
    });
    if (!partner) throw new NotFoundException({ code: "PARTNER_NOT_FOUND" });
  }
}
