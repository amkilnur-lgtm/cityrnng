import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Public } from "../auth/decorators/public.decorator";
import type { AuthenticatedUser } from "../auth/types";
import { CreateInterestDto } from "./dto/create-interest.dto";
import { EventInterestsService } from "./event-interests.service";

@Controller("events/:eventKey/interest")
export class EventInterestsController {
  constructor(private readonly service: EventInterestsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  markGoing(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventKey") eventKey: string,
    @Body() dto: CreateInterestDto,
  ) {
    return this.service.markGoing({
      userId: user.id,
      eventKey,
      locationId: dto.locationId,
    });
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventKey") eventKey: string,
  ) {
    return this.service.cancel(user.id, eventKey);
  }

  @Get("me")
  getMine(
    @CurrentUser() user: AuthenticatedUser,
    @Param("eventKey") eventKey: string,
  ) {
    return this.service.getForUser(user.id, eventKey);
  }

  /** Public — count of RSVPs per location, used for "N идут" UI. */
  @Public()
  @Get("counts")
  counts(@Param("eventKey") eventKey: string) {
    return this.service.countByLocation(eventKey);
  }
}
