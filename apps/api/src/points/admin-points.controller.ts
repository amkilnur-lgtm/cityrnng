import { randomUUID } from "node:crypto";
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { PointActorType, PointReasonType } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ROLE_ADMIN, type AuthenticatedUser } from "../auth/types";
import { AdjustPointsDto } from "./dto/adjust-points.dto";
import { PointsService } from "./points.service";

@Controller("admin/points")
@UseGuards(RolesGuard)
@Roles(ROLE_ADMIN)
export class AdminPointsController {
  constructor(private readonly points: PointsService) {}

  @Post("adjust")
  @HttpCode(HttpStatus.OK)
  adjust(@Body() dto: AdjustPointsDto, @CurrentUser() admin: AuthenticatedUser) {
    const idempotencyKey = dto.idempotencyKey
      ? `manual_adjustment:${dto.idempotencyKey}`
      : `manual_adjustment:${randomUUID()}`;
    return this.points.post({
      userId: dto.userId,
      direction: dto.direction,
      amount: dto.amount,
      reasonType: PointReasonType.manual_adjustment,
      idempotencyKey,
      comment: dto.comment,
      actor: { type: PointActorType.admin, id: admin.id },
    });
  }
}
