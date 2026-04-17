import { Controller, Get, Query } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../auth/types";
import { ListHistoryQuery } from "./dto/list-history.query";
import { PointsService } from "./points.service";

@Controller("points")
export class PointsController {
  constructor(private readonly points: PointsService) {}

  @Get("balance")
  async balance(@CurrentUser() user: AuthenticatedUser) {
    return { balance: await this.points.getBalance(user.id) };
  }

  @Get("history")
  history(@CurrentUser() user: AuthenticatedUser, @Query() query: ListHistoryQuery) {
    return this.points.listHistory(user.id, query);
  }
}
