import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { Roles } from "../../auth/decorators/roles.decorator";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { ROLE_ADMIN } from "../../auth/types";
import { AttendanceMatcherService } from "../../attendances/attendance-matcher.service";
import { AdminSyncDto } from "./dto/admin-sync.dto";
import { StravaIngestionService } from "./strava-ingestion.service";

@Controller("admin/integrations/strava")
@UseGuards(RolesGuard)
@Roles(ROLE_ADMIN)
export class AdminStravaController {
  constructor(
    private readonly ingestion: StravaIngestionService,
    private readonly matcher: AttendanceMatcherService,
  ) {}

  @Post("sync")
  @HttpCode(HttpStatus.OK)
  async sync(@Body() dto: AdminSyncDto) {
    const range = {
      after: dto.after ? new Date(dto.after) : undefined,
      before: dto.before ? new Date(dto.before) : undefined,
    };
    const ingestion = await this.ingestion.ingestForUser(dto.userId, range);
    const matching = await this.matcher.matchForUser(dto.userId, range);
    return { ingestion, matching };
  }

  @Post("match")
  @HttpCode(HttpStatus.OK)
  async match(@Body() dto: AdminSyncDto) {
    const matching = await this.matcher.matchForUser(dto.userId, {
      after: dto.after ? new Date(dto.after) : undefined,
      before: dto.before ? new Date(dto.before) : undefined,
    });
    return { matching };
  }
}
