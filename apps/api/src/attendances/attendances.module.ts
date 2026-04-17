import { Module } from "@nestjs/common";
import { PointsModule } from "../points/points.module";
import { AdminAttendancesController } from "./admin-attendances.controller";
import { AttendanceMatcherService } from "./attendance-matcher.service";
import { AttendancesService } from "./attendances.service";

@Module({
  imports: [PointsModule],
  controllers: [AdminAttendancesController],
  providers: [AttendancesService, AttendanceMatcherService],
  exports: [AttendancesService, AttendanceMatcherService],
})
export class AttendancesModule {}
