import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
} from "@nestjs/common";
import { Public } from "../../auth/decorators/public.decorator";
import { StravaSubscriptionService } from "./strava-subscription.service";
import { StravaWebhookService } from "./strava-webhook.service";
import type { StravaWebhookEvent } from "./types";

interface VerifyQuery {
  "hub.mode"?: string;
  "hub.challenge"?: string;
  "hub.verify_token"?: string;
}

/**
 * Endpoint Strava posts push-subscription events to.
 *
 * GET — one-time verification handshake when we (re)register the
 * subscription. Strava sends `?hub.mode=subscribe&hub.challenge=...&hub.verify_token=...`
 * and expects `{ "hub.challenge": "<echo>" }` back, only if the token matches
 * our secret. Anything else → 400.
 *
 * POST — actual events (activity create/update/delete, athlete deauth). We
 * 200 immediately and queue the work fire-and-forget, because Strava times
 * out webhooks after 2 seconds.
 */
@Controller("integrations/strava/webhook")
@Public()
export class StravaWebhookController {
  private readonly logger = new Logger(StravaWebhookController.name);

  constructor(
    private readonly webhook: StravaWebhookService,
    private readonly subscription: StravaSubscriptionService,
  ) {}

  @Get()
  verify(@Query() query: VerifyQuery): { "hub.challenge": string } {
    const mode = query["hub.mode"];
    const token = query["hub.verify_token"];
    const challenge = query["hub.challenge"];
    const expected = this.subscription.verifyToken();
    if (mode !== "subscribe" || token !== expected || !challenge) {
      this.logger.warn(
        `Webhook verify failed: mode=${mode} tokenMatches=${token === expected} hasChallenge=${!!challenge}`,
      );
      throw new BadRequestException({ code: "STRAVA_WEBHOOK_VERIFY_FAILED" });
    }
    return { "hub.challenge": challenge };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  receive(@Body() event: StravaWebhookEvent): { ok: true } {
    // Ack first. Process in background so Strava never waits on our work.
    // Errors inside handle() are logged but never bubble — webhook contract
    // says retry on non-2xx, and we don't want infinite retries for bugs.
    void this.webhook.handle(event);
    return { ok: true };
  }
}
