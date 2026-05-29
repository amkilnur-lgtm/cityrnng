import { Controller, Get, UseGuards } from "@nestjs/common";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ROLE_ADMIN } from "../auth/types";
import { AdminDashboardService } from "./admin-dashboard.service";

@Controller("admin/dashboard")
@UseGuards(RolesGuard)
@Roles(ROLE_ADMIN)
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  /**
   * Operating-console snapshot: health-bar, KPIs, Strava-flow strip, next
   * upcoming + last past event. All read-only Prisma aggregates plus a single
   * Strava push-subscription lookup. Recomputed every call; for ~1k users
   * this is sub-100ms.
   */
  @Get("summary")
  summary() {
    return this.service.summary();
  }
}
