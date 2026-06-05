import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ROLE_PARTNER, type AuthenticatedUser } from "../auth/types";
import { PartnerMembersService } from "./partner-members.service";
import { RedemptionsService } from "./redemptions.service";

/**
 * Partner-side endpoints for verifying redemption codes presented by
 * customers in person. Membership in `PartnerMember` is what scopes a
 * partner-role user to a specific Partner; the role alone gives UI access
 * but no operational power.
 */
@Controller("partner")
@UseGuards(RolesGuard)
@Roles(ROLE_PARTNER)
export class PartnerRedemptionsController {
  constructor(
    private readonly members: PartnerMembersService,
    private readonly redemptions: RedemptionsService,
  ) {}

  /**
   * List partners the current user is a member of. Used by the partner UI
   * to (a) detect "no membership" state and (b) populate the switcher when
   * the user belongs to multiple teams.
   */
  @Get("memberships")
  async myMemberships(@CurrentUser() user: AuthenticatedUser) {
    const memberships = await this.members.listPartnersForUser(user.id);
    return memberships.map((m) => ({
      partnerId: m.partner.id,
      partnerSlug: m.partner.slug,
      partnerName: m.partner.name,
    }));
  }

  /**
   * Recent redemptions across all partner-teams the user belongs to. Used by
   * the /partner cabinet to show "что прошло за последнее время" — кто и
   * какую награду гасил, когда, статус. Limited to 20 latest across the
   * user's partner teams.
   *
   * If the user has no memberships → empty array (UI shows empty state).
   */
  @Get("redemptions/recent")
  async listRecent(@CurrentUser() user: AuthenticatedUser) {
    const memberships = await this.members.listPartnersForUser(user.id);
    if (memberships.length === 0) return [];

    const partnerIds = memberships.map((m) => m.partnerId);
    const items = await this.redemptions.listForPartners({
      partnerIds,
      take: 20,
    });
    return items.map((r) => ({
      id: r.id,
      code: r.code,
      status: r.status,
      createdAt: r.createdAt,
      usedAt: r.usedAt,
      partnerName: r.reward.partner.name,
      partnerSlug: r.reward.partner.slug,
      rewardTitle: r.reward.title,
      userEmail: r.user.email,
      userDisplayName: r.user.profile?.displayName ?? null,
    }));
  }

  /**
   * Verify a redemption code on behalf of a partner the user is a member
   * of. `partnerId` query param is required only when the user belongs to
   * multiple partners; otherwise it auto-resolves.
   *
   * Returns 404 (not 403) when the code belongs to a different partner —
   * we don't want to leak whether arbitrary codes exist in the system.
   */
  @Post("redemptions/verify/:code")
  @HttpCode(HttpStatus.OK)
  async verifyCode(
    @CurrentUser() user: AuthenticatedUser,
    @Param("code") code: string,
    @Query("partnerId") partnerIdParam?: string,
  ) {
    const memberships = await this.members.listPartnersForUser(user.id);
    if (memberships.length === 0) {
      throw new ForbiddenException({ code: "PARTNER_NOT_LINKED" });
    }

    let partnerId: string;
    if (memberships.length === 1) {
      partnerId = memberships[0].partnerId;
    } else {
      if (!partnerIdParam) {
        throw new ForbiddenException({ code: "PARTNER_ID_REQUIRED" });
      }
      const match = memberships.find((m) => m.partnerId === partnerIdParam);
      if (!match) throw new ForbiddenException({ code: "PARTNER_NOT_LINKED" });
      partnerId = match.partnerId;
    }

    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      throw new NotFoundException({ code: "REDEMPTION_NOT_FOUND" });
    }

    // Pre-check ownership before mutating: look up reward.partnerId via the
    // existing list filter. Cheap and lets us return 404 without changing
    // RedemptionsService's contract.
    const matches = await this.redemptions.listForAdmin({
      code: normalized,
      partnerId,
      take: 1,
    });
    if (matches.length === 0) {
      throw new NotFoundException({ code: "REDEMPTION_NOT_FOUND" });
    }

    return this.redemptions.markUsedByCode(normalized, user.id);
  }
}
