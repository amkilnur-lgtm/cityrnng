import { Body, Controller, HttpCode, HttpStatus, Post, Req } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import { Public } from "./decorators/public.decorator";
import { LoginDto } from "./dto/login.dto";
import { LogoutDto } from "./dto/logout.dto";
import { RefreshLoginDto } from "./dto/refresh-login.dto";
import { RegisterDto } from "./dto/register.dto";
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

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("register")
  @HttpCode(HttpStatus.OK)
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.auth.registerWithPassword(dto, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.loginWithPassword(dto.email, dto.password, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshLoginDto, @Req() req: Request) {
    return this.auth.refresh(dto.refreshToken, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });
  }

  @Public()
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: LogoutDto) {
    return this.auth.logout(dto.refreshToken);
  }
}
