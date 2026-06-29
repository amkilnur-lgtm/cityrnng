import { Module } from "@nestjs/common";
import { EventsModule } from "../../events/events.module";
import { PointsModule } from "../../points/points.module";
import { CheckinController } from "./checkin.controller";
import { CheckinService } from "./checkin.service";

@Module({
  imports: [EventsModule, PointsModule],
  controllers: [CheckinController],
  providers: [CheckinService],
  exports: [CheckinService],
})
export class CheckinModule {}
