import { Body, Controller, HttpCode, HttpStatus, Post, Req } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import { Public } from "./decorators/public.decorator";
import { RequestLoginDto } from "./dto/request-login.dto";
import { VerifyLoginDto } from "./dto/verify-login.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post("request-login")
  @HttpCode(HttpStatus.ACCEPTED)
  requestLogin(@Body() dto: RequestLoginDto) {
    return this.auth.requestLogin(dto.email);
  }

  @Public()
  @Post("verify-login")
  @HttpCode(HttpStatus.OK)
  verifyLogin(@Body() dto: VerifyLoginDto, @Req() req: Request) {
    return this.auth.verifyLogin(dto.token, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });
  }
}
