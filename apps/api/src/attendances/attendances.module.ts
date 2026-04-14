import { Module } from "@nestjs/common";
import { AdminAttendancesController } from "./admin-attendances.controller";
import { AttendancesService } from "./attendances.service";

@Module({
  controllers: [AdminAttendancesController],
  providers: [AttendancesService],
  exports: [AttendancesService],
})
export class AttendancesModule {}
