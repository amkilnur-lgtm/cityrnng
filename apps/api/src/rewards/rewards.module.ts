import { Module } from "@nestjs/common";
import { PointsModule } from "../points/points.module";
import { AdminRewardsController } from "./admin-rewards.controller";
import { PartnersService } from "./partners.service";
import { RedemptionsService } from "./redemptions.service";
import { RewardsController } from "./rewards.controller";
import { RewardsService } from "./rewards.service";

@Module({
  imports: [PointsModule],
  controllers: [RewardsController, AdminRewardsController],
  providers: [PartnersService, RewardsService, RedemptionsService],
  exports: [PartnersService, RewardsService, RedemptionsService],
})
export class RewardsModule {}
