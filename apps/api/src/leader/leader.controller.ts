import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ROLE_LEADER, type AuthenticatedUser } from "../auth/types";
import { LeaderScanDto } from "./dto/leader-scan.dto";
import { LeaderService } from "./leader.service";

/**
 * Leader cabinet — manual QR check-in from a phone when no fixed runbase
 * device is present. Authenticated by the caller's session + `leader` role
 * (RolesGuard reads the JWT; the web middleware refreshes the token on the
 * `/leader` path so a freshly-granted role is picked up without a relogin).
 */
@Controller("leader")
@UseGuards(RolesGuard)
@Roles(ROLE_LEADER)
export class LeaderController {
  constructor(private readonly leader: LeaderService) {}

  @Get("locations")
  listLocations() {
    return this.leader.listLocations();
  }

  @Post("checkin")
  @HttpCode(HttpStatus.OK)
  scan(@Body() dto: LeaderScanDto, @CurrentUser() user: AuthenticatedUser) {
    return this.leader.scan(user.id, dto.locationId, dto.code);
  }

  @Get("checkin/recent")
  recent(@Query("locationId") locationId: string) {
    return this.leader.recentScans(locationId);
  }
}
