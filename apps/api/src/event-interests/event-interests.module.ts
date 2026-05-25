import { Module } from "@nestjs/common";
import { EventsModule } from "../events/events.module";
import { EventInterestsController } from "./event-interests.controller";
import { EventInterestsService } from "./event-interests.service";

@Module({
  imports: [EventsModule],
  controllers: [EventInterestsController],
  providers: [EventInterestsService],
  exports: [EventInterestsService],
})
export class EventInterestsModule {}
