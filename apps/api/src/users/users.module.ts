import { Module } from "@nestjs/common";
import { PointsModule } from "../points/points.module";
import { UsersService } from "./users.service";

@Module({
  imports: [PointsModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
