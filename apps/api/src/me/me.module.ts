import { Module } from "@nestjs/common";
import { EventsModule } from "../events/events.module";
import { UsersModule } from "../users/users.module";
import { MeController } from "./me.controller";
import { MeTimelineService } from "./me-timeline.service";

@Module({
  imports: [UsersModule, EventsModule],
  controllers: [MeController],
  providers: [MeTimelineService],
})
export class MeModule {}
