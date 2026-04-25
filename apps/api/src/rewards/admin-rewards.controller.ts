import {
  Body,
  Controller,
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
import { CancelRedemptionDto } from "./dto/cancel-redemption.dto";
import { CreatePartnerDto } from "./dto/create-partner.dto";
import { CreateRewardDto } from "./dto/create-reward.dto";
import { UpdatePartnerDto } from "./dto/update-partner.dto";
import { UpdateRewardDto } from "./dto/update-reward.dto";
import { PartnersService } from "./partners.service";
import { RedemptionsService } from "./redemptions.service";
import { RewardsService } from "./rewards.service";

@Controller("admin")
@Roles(ROLE_ADMIN)
export class AdminRewardsController {
  constructor(
    private readonly partners: PartnersService,
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

  // Redemptions (verify / cancel)

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
