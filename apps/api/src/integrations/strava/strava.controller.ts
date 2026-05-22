import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from "@nestjs/common";
import { AttendanceMatcherService } from "../../attendances/attendance-matcher.service";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { Public } from "../../auth/decorators/public.decorator";
import type { AuthenticatedUser } from "../../auth/types";
import { StravaCallbackQuery } from "./dto/callback.query";
import { StravaAccountsService } from "./strava-accounts.service";
import { StravaIngestionService } from "./strava-ingestion.service";
import { StravaOAuthService } from "./strava-oauth.service";

const MAX_BACKFILL_DAYS = 30;

@Controller("integrations/strava")
export class StravaController {
  constructor(
    private readonly oauth: StravaOAuthService,
    private readonly accounts: StravaAccountsService,
    private readonly ingestion: StravaIngestionService,
    private readonly matcher: AttendanceMatcherService,
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

  /**
   * User-triggered sync. Pulls activities since the later of
   * `account.connectedAt` and `now - 30 days`, then runs the matcher.
   * Returns small summary for the UI toast.
   *
   * Webhook handles new activities in real time, but this endpoint is a
   * fallback for when webhook dropped (Strava had an outage, user reconnected,
   * we just rolled out webhook for the first time, etc).
   */
  @Post("sync")
  @HttpCode(HttpStatus.OK)
  async sync(@CurrentUser() user: AuthenticatedUser) {
    const account = await this.accounts.findActive(user.id);
    if (!account) {
      throw new BadRequestException({ code: "STRAVA_NOT_CONNECTED" });
    }
    const connectedAt = account.connectedAt;
    const horizon = new Date(Date.now() - MAX_BACKFILL_DAYS * 24 * 60 * 60 * 1000);
    const after = connectedAt > horizon ? connectedAt : horizon;
    const ingestion = await this.ingestion.ingestForUser(user.id, { after });
    const matching = await this.matcher.matchForUser(user.id, { after });
    return {
      ingestion,
      matching,
    };
  }
}
