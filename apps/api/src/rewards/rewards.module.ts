import { Module } from "@nestjs/common";
import { PointsModule } from "../points/points.module";
import { UsersModule } from "../users/users.module";
import { AdminRewardsController } from "./admin-rewards.controller";
import { PartnerMembersService } from "./partner-members.service";
import { PartnersService } from "./partners.service";
import { PartnerRedemptionsController } from "./partner-redemptions.controller";
import { RedemptionsService } from "./redemptions.service";
import { RewardsController } from "./rewards.controller";
import { RewardsService } from "./rewards.service";

@Module({
  imports: [PointsModule, UsersModule],
  controllers: [
    RewardsController,
    AdminRewardsController,
    PartnerRedemptionsController,
  ],
  providers: [
    PartnersService,
    PartnerMembersService,
    RewardsService,
    RedemptionsService,
  ],
  exports: [
    PartnersService,
    PartnerMembersService,
    RewardsService,
    RedemptionsService,
  ],
})
export class RewardsModule {}
