import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  NotFoundException,
  ParseIntPipe,
  Patch,
  Query,
} from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UsersService, rolesOf } from "../users/users.service";
import type { AuthenticatedUser } from "../auth/types";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { MeTimelineService } from "./me-timeline.service";

@Controller("me")
export class MeController {
  constructor(
    private readonly users: UsersService,
    private readonly timeline: MeTimelineService,
  ) {}

  @Get()
  async me(@CurrentUser() current: AuthenticatedUser) {
    const user = await this.users.findByIdWithRelations(current.id);
    if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND" });
    return mapMe(user);
  }

  @Patch()
  async updateMe(
    @CurrentUser() current: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const user = await this.users.updateProfile(current.id, dto);
    return mapMe(user);
  }

  /**
   * Personal dashboard's "month grid" data. monthOffset=0 → current month,
   * -1 → previous, etc. Falls back to padding from the previous month if
   * the current one has fewer than 4 event-bearing dates.
   */
  @Get("timeline")
  async timelineFor(
    @CurrentUser() current: AuthenticatedUser,
    @Query("monthOffset", new DefaultValuePipe(0), new ParseIntPipe()) monthOffset: number,
  ) {
    return this.timeline.build(current.id, monthOffset);
  }
}

function mapMe(user: Awaited<ReturnType<UsersService["findByIdWithRelations"]>>) {
  if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND" });
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    roles: rolesOf(user),
    profile: user.profile
      ? {
          displayName: user.profile.displayName,
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          city: user.profile.city,
          instagramHandle: user.profile.instagramHandle,
          telegramHandle: user.profile.telegramHandle,
        }
      : null,
  };
}
