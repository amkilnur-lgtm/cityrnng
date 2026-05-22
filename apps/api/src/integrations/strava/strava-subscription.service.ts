import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "../../config/env.schema";
import { StravaApiClient } from "./strava-api.client";
import type { StravaSubscription } from "./types";

/**
 * Manages the single app-wide Strava push subscription. Strava enforces
 * exactly one subscription per application — `create` returns 400 if a
 * subscription already exists. This service is the only writer touching
 * `POST/DELETE /push_subscriptions` so callers can rely on these methods
 * to be idempotent.
 *
 * Subscription state lives entirely on Strava's side; we don't cache it
 * locally — `listSubscriptions()` is cheap (single GET) and gives us the
 * truth on demand. Avoids drift between our DB and theirs.
 */
@Injectable()
export class StravaSubscriptionService {
  private readonly logger = new Logger(StravaSubscriptionService.name);

  constructor(
    private readonly api: StravaApiClient,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** Full URL Strava POSTs webhook events to. */
  callbackUrl(): string {
    const origin = this.config.get("STRAVA_WEBHOOK_CALLBACK_ORIGIN", { infer: true });
    return `${origin.replace(/\/$/, "")}/api/v1/integrations/strava/webhook`;
  }

  verifyToken(): string {
    return this.config.get("STRAVA_WEBHOOK_VERIFY_TOKEN", { infer: true });
  }

  /** Return the current subscription (if any). */
  async getCurrent(): Promise<StravaSubscription | null> {
    const subs = await this.api.listSubscriptions();
    return subs[0] ?? null;
  }

  /**
   * Ensure a subscription exists pointing at our callback. If a stale one
   * exists with a different callback URL, replace it. Returns the live
   * subscription.
   */
  async ensureSubscribed(): Promise<StravaSubscription> {
    const wanted = this.callbackUrl();
    const current = await this.getCurrent();
    if (current && current.callback_url === wanted) {
      return current;
    }
    if (current) {
      this.logger.log(
        `Replacing stale Strava subscription ${current.id} (${current.callback_url} → ${wanted})`,
      );
      await this.api.deleteSubscription(current.id);
    }
    const created = await this.api.createSubscription(wanted, this.verifyToken());
    this.logger.log(`Registered Strava subscription ${created.id} for ${wanted}`);
    return created;
  }

  /** Remove the subscription if any exists. Idempotent. */
  async unsubscribe(): Promise<void> {
    const current = await this.getCurrent();
    if (!current) return;
    await this.api.deleteSubscription(current.id);
    this.logger.log(`Removed Strava subscription ${current.id}`);
  }
}
