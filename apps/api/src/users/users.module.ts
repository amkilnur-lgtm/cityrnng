import { Module } from "@nestjs/common";
import { CryptoModule } from "../crypto/crypto.module";
import { PointsModule } from "../points/points.module";
import { AdminUsersController } from "./admin-users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [PointsModule, CryptoModule],
  controllers: [AdminUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
