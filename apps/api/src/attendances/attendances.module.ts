import { Module } from "@nestjs/common";
import { AdminAttendancesController } from "./admin-attendances.controller";
import { AttendanceMatcherService } from "./attendance-matcher.service";
import { AttendancesService } from "./attendances.service";

@Module({
  controllers: [AdminAttendancesController],
  providers: [AttendancesService, AttendanceMatcherService],
  exports: [AttendancesService, AttendanceMatcherService],
})
export class AttendancesModule {}
