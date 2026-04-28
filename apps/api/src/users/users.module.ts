import { Module } from "@nestjs/common";
import { PointsModule } from "../points/points.module";
import { AdminUsersController } from "./admin-users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [PointsModule],
  controllers: [AdminUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
