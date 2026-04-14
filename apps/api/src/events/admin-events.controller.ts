import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AttendanceStatus } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ROLE_ADMIN, type AuthenticatedUser } from "../auth/types";
import { AttendancesService } from "../attendances/attendances.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { UpsertSyncRuleDto } from "./dto/upsert-sync-rule.dto";
import { EventsService } from "./events.service";
import { SyncRulesService } from "./sync-rules.service";
import {
  IsEnum,
  IsOptional,
} from "class-validator";

class ListAttendancesQuery {
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;
}

@Controller("admin/events")
@UseGuards(RolesGuard)
@Roles(ROLE_ADMIN)
export class AdminEventsController {
  constructor(
    private readonly events: EventsService,
    private readonly syncRules: SyncRulesService,
    private readonly attendances: AttendancesService,
  ) {}

  @Post()
  create(@Body() dto: CreateEventDto, @CurrentUser() user: AuthenticatedUser) {
    return this.events.create(dto, user.id);
  }

  @Patch(":id")
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.events.update(id, dto);
  }

  @Put(":id/sync-rules")
  upsertSyncRule(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpsertSyncRuleDto,
  ) {
    return this.syncRules.upsertForEvent(id, dto);
  }

  @Get(":id/attendances")
  listAttendances(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query() query: ListAttendancesQuery,
  ) {
    return this.attendances.listForEvent(id, query.status);
  }
}
