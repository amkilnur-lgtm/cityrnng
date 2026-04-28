import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ROLE_ADMIN, type AuthenticatedUser } from "../auth/types";
import { UsersService } from "./users.service";

class ListUsersQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;
}

@Controller("admin/users")
@UseGuards(RolesGuard)
@Roles(ROLE_ADMIN)
export class AdminUsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@Query() query: ListUsersQuery) {
    return this.users.listAdmin({ limit: query.limit, cursor: query.cursor });
  }

  @Post(":id/roles/:roleCode")
  @HttpCode(HttpStatus.OK)
  grantRole(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("roleCode") roleCode: string,
  ) {
    return this.users.grantRole(id, roleCode);
  }

  @Delete(":id/roles/:roleCode")
  @HttpCode(HttpStatus.OK)
  revokeRole(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("roleCode") roleCode: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.users.revokeRole(id, roleCode, actor.id);
  }
}
