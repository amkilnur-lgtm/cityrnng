import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ROLE_ADMIN, type AuthenticatedUser } from "../auth/types";
import { CreateRecurrenceRuleDto } from "./dto/create-recurrence-rule.dto";
import { UpdateRecurrenceRuleDto } from "./dto/update-recurrence-rule.dto";
import { RecurrenceRulesService } from "./recurrence-rules.service";

@Controller("admin/recurrence-rules")
@UseGuards(RolesGuard)
@Roles(ROLE_ADMIN)
export class AdminRecurrenceController {
  constructor(private readonly rules: RecurrenceRulesService) {}

  @Get()
  list() {
    return this.rules.list();
  }

  @Get(":id")
  getOne(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.rules.getByIdOrThrow(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateRecurrenceRuleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rules.create(dto, user.id);
  }

  @Patch(":id")
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRecurrenceRuleDto,
  ) {
    return this.rules.update(id, dto);
  }
}
