import { Module } from "@nestjs/common";
import { EventsModule } from "../../events/events.module";
import { PointsModule } from "../../points/points.module";
import { AdminCheckinController } from "./admin-checkin.controller";
import { AdminCheckinService } from "./admin-checkin.service";
import { CheckinController } from "./checkin.controller";
import { CheckinService } from "./checkin.service";

@Module({
  imports: [EventsModule, PointsModule],
  controllers: [CheckinController, AdminCheckinController],
  providers: [CheckinService, AdminCheckinService],
  exports: [CheckinService],
})
export class CheckinModule {}
