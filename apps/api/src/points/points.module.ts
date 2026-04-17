import { Module } from "@nestjs/common";
import { AdminPointsController } from "./admin-points.controller";
import { PointsAwardsService } from "./points-awards.service";
import { PointsController } from "./points.controller";
import { PointsService } from "./points.service";

@Module({
  controllers: [PointsController, AdminPointsController],
  providers: [PointsService, PointsAwardsService],
  exports: [PointsService, PointsAwardsService],
})
export class PointsModule {}
