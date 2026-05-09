import { Module } from "@nestjs/common";
import { EventInterestsController } from "./event-interests.controller";
import { EventInterestsService } from "./event-interests.service";

@Module({
  controllers: [EventInterestsController],
  providers: [EventInterestsService],
  exports: [EventInterestsService],
})
export class EventInterestsModule {}
