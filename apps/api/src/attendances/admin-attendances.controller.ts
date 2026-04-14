import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ROLE_ADMIN, type AuthenticatedUser } from "../auth/types";
import { AttendancesService } from "./attendances.service";
import { RejectAttendanceDto } from "./dto/reject-attendance.dto";

@Controller("admin/attendances")
@UseGuards(RolesGuard)
@Roles(ROLE_ADMIN)
export class AdminAttendancesController {
  constructor(private readonly attendances: AttendancesService) {}

  @Post(":id/approve")
  @HttpCode(HttpStatus.OK)
  approve(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendances.approve(id, user.id);
  }

  @Post(":id/reject")
  @HttpCode(HttpStatus.OK)
  reject(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: RejectAttendanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendances.reject(id, user.id, dto.reason);
  }
}
