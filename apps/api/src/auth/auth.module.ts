import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { LoginChallengeService } from "./login-challenge.service";
import { TokensService } from "./tokens.service";

@Module({
  imports: [UsersModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, LoginChallengeService, TokensService],
  exports: [TokensService, JwtModule],
})
export class AuthModule {}
