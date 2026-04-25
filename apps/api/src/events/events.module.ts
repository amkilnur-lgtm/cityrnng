import { Module } from "@nestjs/common";
import { AttendancesModule } from "../attendances/attendances.module";
import { AdminEventsController } from "./admin-events.controller";
import { EventOccurrenceService } from "./event-occurrence.service";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";
import { SyncRulesService } from "./sync-rules.service";

@Module({
  imports: [AttendancesModule],
  controllers: [EventsController, AdminEventsController],
  providers: [EventsService, SyncRulesService, EventOccurrenceService],
  exports: [EventsService, EventOccurrenceService],
})
export class EventsModule {}
