import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ROLE_ADMIN } from "../auth/types";
import { CreateLocationDto } from "./dto/create-location.dto";
import { ListLocationsQuery } from "./dto/list-locations.query";
import { UpdateLocationDto } from "./dto/update-location.dto";
import { UpsertPaceGroupDto } from "./dto/upsert-pace-group.dto";
import { LocationsService } from "./locations.service";

@Controller("admin/locations")
@UseGuards(RolesGuard)
@Roles(ROLE_ADMIN)
export class AdminLocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Get()
  list(@Query() query: ListLocationsQuery) {
    return this.locations.list(query);
  }

  @Post()
  create(@Body() dto: CreateLocationDto) {
    return this.locations.create(dto);
  }

  @Patch(":id")
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locations.update(id, dto);
  }

  @Get(":id/pace-groups")
  listPaceGroups(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.locations.listPaceGroups(id);
  }

  @Post(":id/pace-groups")
  addPaceGroup(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpsertPaceGroupDto,
  ) {
    return this.locations.addPaceGroup(id, dto);
  }

  @Delete(":id/pace-groups/:paceGroupId")
  deletePaceGroup(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Param("paceGroupId", new ParseUUIDPipe()) paceGroupId: string,
  ) {
    return this.locations.deletePaceGroup(id, paceGroupId);
  }
}
