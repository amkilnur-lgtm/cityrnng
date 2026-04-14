import { Module } from "@nestjs/common";
import { AttendancesModule } from "../attendances/attendances.module";
import { AdminEventsController } from "./admin-events.controller";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";
import { SyncRulesService } from "./sync-rules.service";

@Module({
  imports: [AttendancesModule],
  controllers: [EventsController, AdminEventsController],
  providers: [EventsService, SyncRulesService],
  exports: [EventsService],
})
export class EventsModule {}
