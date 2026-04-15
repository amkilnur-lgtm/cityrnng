import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Query,
} from "@nestjs/common";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { Public } from "../../auth/decorators/public.decorator";
import type { AuthenticatedUser } from "../../auth/types";
import { StravaCallbackQuery } from "./dto/callback.query";
import { StravaAccountsService } from "./strava-accounts.service";
import { StravaOAuthService } from "./strava-oauth.service";

@Controller("integrations/strava")
export class StravaController {
  constructor(
    private readonly oauth: StravaOAuthService,
    private readonly accounts: StravaAccountsService,
  ) {}

  @Get("connect")
  async connect(@CurrentUser() user: AuthenticatedUser) {
    const authorizeUrl = await this.oauth.buildAuthorizeUrl(user.id);
    return { authorizeUrl };
  }

  @Public()
  @Get("callback")
  async callback(@Query() query: StravaCallbackQuery) {
    if (query.error) {
      throw new BadRequestException({ code: "STRAVA_AUTHORIZATION_DENIED", details: { error: query.error } });
    }
    if (!query.code) {
      throw new BadRequestException({ code: "STRAVA_CALLBACK_MISSING_CODE" });
    }
    const userId = await this.oauth.verifyState(query.state);
    const tokens = await this.oauth.exchangeCode(query.code);
    const account = await this.accounts.upsertFromTokenResponse(userId, tokens);
    return {
      connected: true,
      providerUserId: account.providerUserId,
      scope: account.scope,
    };
  }

  @Get("status")
  async status(@CurrentUser() user: AuthenticatedUser) {
    const account = await this.accounts.findActive(user.id);
    if (!account) return { connected: false };
    return {
      connected: true,
      providerUserId: account.providerUserId,
      scope: account.scope,
      connectedAt: account.connectedAt,
      tokenExpiresAt: account.tokenExpiresAt,
    };
  }

  @Delete("disconnect")
  @HttpCode(HttpStatus.NO_CONTENT)
  async disconnect(@CurrentUser() user: AuthenticatedUser) {
    await this.accounts.disconnect(user.id);
  }
}
