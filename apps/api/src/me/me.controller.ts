import { Controller, Get, NotFoundException } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UsersService, rolesOf } from "../users/users.service";
import type { AuthenticatedUser } from "../auth/types";

@Controller("me")
export class MeController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async me(@CurrentUser() current: AuthenticatedUser) {
    const user = await this.users.findByIdWithRelations(current.id);
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
}
