import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { ROLE_ADMIN, type AuthenticatedUser } from "../auth/types";
import { AddPartnerMemberDto } from "./dto/add-partner-member.dto";
import { CancelRedemptionDto } from "./dto/cancel-redemption.dto";
import { CreatePartnerDto } from "./dto/create-partner.dto";
import { CreateRewardDto } from "./dto/create-reward.dto";
import { UpdatePartnerDto } from "./dto/update-partner.dto";
import { UpdateRewardDto } from "./dto/update-reward.dto";
import { PartnerMembersService } from "./partner-members.service";
import { PartnersService } from "./partners.service";
import { RedemptionsService } from "./redemptions.service";
import { RewardsService } from "./rewards.service";

@Controller("admin")
@Roles(ROLE_ADMIN)
export class AdminRewardsController {
  constructor(
    private readonly partners: PartnersService,
    private readonly partnerMembers: PartnerMembersService,
    private readonly rewards: RewardsService,
    private readonly redemptions: RedemptionsService,
  ) {}

  // Partners

  @Get("partners")
  listPartners() {
    return this.partners.list();
  }

  @Post("partners")
  @HttpCode(HttpStatus.CREATED)
  createPartner(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePartnerDto,
  ) {
    return this.partners.create(dto, user.id);
  }

  @Patch("partners/:id")
  updatePartner(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePartnerDto,
  ) {
    return this.partners.update(id, dto);
  }

  // Partner team (members)

  @Get("partners/:id/members")
  listPartnerMembers(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.partnerMembers.listForPartner(id);
  }

  @Post("partners/:id/members")
  @HttpCode(HttpStatus.CREATED)
  addPartnerMember(
    @CurrentUser() actor: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: AddPartnerMemberDto,
  ) {
    return this.partnerMembers.addByEmail(id, dto.email, actor.id);
  }

  @Delete("partners/:id/members/:memberId")
  @HttpCode(HttpStatus.OK)
  removePartnerMember(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("memberId", new ParseUUIDPipe()) memberId: string,
  ) {
    return this.partnerMembers.remove(id, memberId);
  }

  // Rewards

  @Get("rewards")
  listRewards(@Query("partnerId") partnerId?: string) {
    return this.rewards.listAdmin({ partnerId });
  }

  @Post("rewards")
  @HttpCode(HttpStatus.CREATED)
  createReward(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRewardDto,
  ) {
    return this.rewards.create(dto, user.id);
  }

  @Patch("rewards/:id")
  updateReward(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRewardDto,
  ) {
    return this.rewards.update(id, dto);
  }

  // Redemptions (list / verify / cancel)

  @Get("redemptions")
  listRedemptions(
    @Query("status") status?: string,
    @Query("partnerId") partnerId?: string,
    @Query("code") code?: string,
  ) {
    const allowedStatuses = ["active", "used", "expired", "cancelled"];
    return this.redemptions.listForAdmin({
      status:
        status && allowedStatuses.includes(status)
          ? (status as "active" | "used" | "expired" | "cancelled")
          : undefined,
      partnerId,
      code,
    });
  }

  @Post("redemptions/verify/:code")
  @HttpCode(HttpStatus.OK)
  markUsed(
    @CurrentUser() user: AuthenticatedUser,
    @Param("code") code: string,
  ) {
    return this.redemptions.markUsedByCode(code.toUpperCase(), user.id);
  }

  @Post("redemptions/:id/cancel")
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: CancelRedemptionDto,
  ) {
    return this.redemptions.cancelAndRefund(id, { reason: dto.reason });
  }
}
