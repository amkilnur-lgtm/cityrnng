import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Public } from "../auth/decorators/public.decorator";
import type { AuthenticatedUser } from "../auth/types";
import { RedeemDto } from "./dto/redeem.dto";
import { PartnersService } from "./partners.service";
import { RedemptionsService } from "./redemptions.service";
import { RewardsService } from "./rewards.service";

@Controller()
export class RewardsController {
  constructor(
    private readonly partners: PartnersService,
    private readonly rewards: RewardsService,
    private readonly redemptions: RedemptionsService,
  ) {}

  @Public()
  @Get("partners")
  listPartners() {
    return this.partners.list({ status: "active" });
  }

  @Public()
  @Get("rewards")
  listRewards(@Query("partner") partnerSlug?: string) {
    return this.rewards.listPublic({ partnerSlug });
  }

  @Public()
  @Get("rewards/:slug")
  getReward(@Param("slug") slug: string) {
    return this.rewards.getPublicBySlugOrThrow(slug);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("rewards/:slug/redeem")
  @HttpCode(HttpStatus.CREATED)
  redeem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("slug") slug: string,
    @Body() dto: RedeemDto,
  ) {
    return this.redemptions.redeem({
      userId: user.id,
      rewardSlug: slug,
      idempotencyKey: dto.idempotencyKey,
    });
  }

  @Get("me/redemptions")
  listMyRedemptions(@CurrentUser() user: AuthenticatedUser) {
    return this.redemptions.listForUser(user.id);
  }

  @Get("me/redemptions/:code")
  getMyRedemptionByCode(
    @CurrentUser() user: AuthenticatedUser,
    @Param("code") code: string,
  ) {
    return this.redemptions.getByCodeForUser(user.id, code.toUpperCase());
  }
}
