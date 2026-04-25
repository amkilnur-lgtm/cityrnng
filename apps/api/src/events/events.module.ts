import { Module } from "@nestjs/common";
import { AttendancesModule } from "../attendances/attendances.module";
import { AdminEventsController } from "./admin-events.controller";
import { AdminRecurrenceController } from "./admin-recurrence.controller";
import { EventOccurrenceService } from "./event-occurrence.service";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";
import { RecurrenceRulesService } from "./recurrence-rules.service";
import { SyncRulesService } from "./sync-rules.service";

@Module({
  imports: [AttendancesModule],
  controllers: [
    EventsController,
    AdminEventsController,
    AdminRecurrenceController,
  ],
  providers: [
    EventsService,
    SyncRulesService,
    EventOccurrenceService,
    RecurrenceRulesService,
  ],
  exports: [EventsService, EventOccurrenceService, RecurrenceRulesService],
})
export class EventsModule {}
