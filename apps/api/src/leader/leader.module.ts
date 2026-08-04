import { Module } from "@nestjs/common";
import { CheckinModule } from "../integrations/checkin/checkin.module";
import { LeaderController } from "./leader.controller";
import { LeaderService } from "./leader.service";

@Module({
  imports: [CheckinModule],
  controllers: [LeaderController],
  providers: [LeaderService],
})
export class LeaderModule {}
