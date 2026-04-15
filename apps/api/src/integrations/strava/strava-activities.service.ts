import { Injectable } from "@nestjs/common";
import { StravaAccountsService } from "./strava-accounts.service";
import { StravaApiClient } from "./strava-api.client";
import type { StravaActivity } from "./types";

export interface ListActivitiesOptions {
  after?: Date;
  before?: Date;
  page?: number;
  perPage?: number;
}

/**
 * Read-only foundation for fetching Strava activities.
 * Intentionally does NOT persist anything yet — ingestion lands in a later PR.
 */
@Injectable()
export class StravaActivitiesService {
  constructor(
    private readonly accounts: StravaAccountsService,
    private readonly api: StravaApiClient,
  ) {}

  async listForUser(userId: string, options: ListActivitiesOptions = {}): Promise<StravaActivity[]> {
    const accessToken = await this.accounts.getFreshAccessToken(userId);
    return this.api.listActivities({
      accessToken,
      after: options.after ? Math.floor(options.after.getTime() / 1000) : undefined,
      before: options.before ? Math.floor(options.before.getTime() / 1000) : undefined,
      page: options.page,
      perPage: options.perPage,
    });
  }
}
