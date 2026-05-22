import { Injectable, NotFoundException } from "@nestjs/common";
import { SyncProvider } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { StravaAccountsService } from "./strava-accounts.service";
import { StravaActivitiesService } from "./strava-activities.service";
import type { StravaActivity } from "./types";

export interface IngestOptions {
  after?: Date;
  before?: Date;
  perPage?: number;
  pageLimit?: number;
}

export interface IngestSummary {
  fetched: number;
  upserted: number;
  pages: number;
}

@Injectable()
export class StravaIngestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: StravaAccountsService,
    private readonly activities: StravaActivitiesService,
  ) {}

  /**
   * Fetch & upsert a single activity by external id. Used by webhook handlers
   * where Strava just told us about a specific activity, no need to scan.
   * Returns the upserted row's externalId or null if the activity could not
   * be fetched / parsed (e.g. private, deleted right after, etc).
   */
  async ingestSingleActivity(
    userId: string,
    activityId: number | string,
  ): Promise<string | null> {
    const account = await this.accounts.findActive(userId);
    if (!account) throw new NotFoundException({ code: "STRAVA_NOT_CONNECTED" });
    const activity = await this.activities.fetchSingle(userId, activityId);
    const row = this.toRow(activity);
    if (!row) return null;
    await this.prisma.externalActivity.upsert({
      where: { provider_externalId: { provider: SyncProvider.strava, externalId: row.externalId } },
      create: {
        ...row,
        userId,
        provider: SyncProvider.strava,
        userProviderAccountId: account.id,
      },
      update: {
        activityType: row.activityType,
        startedAt: row.startedAt,
        elapsedSeconds: row.elapsedSeconds,
        distanceMeters: row.distanceMeters,
        startLat: row.startLat,
        startLng: row.startLng,
        endLat: row.endLat,
        endLng: row.endLng,
        payloadJson: row.payloadJson,
      },
    });
    return row.externalId;
  }

  async ingestForUser(userId: string, options: IngestOptions = {}): Promise<IngestSummary> {
    const account = await this.accounts.findActive(userId);
    if (!account) throw new NotFoundException({ code: "STRAVA_NOT_CONNECTED" });

    const perPage = options.perPage ?? 50;
    const pageLimit = options.pageLimit ?? 5;

    let fetched = 0;
    let upserted = 0;
    let pages = 0;

    for (let page = 1; page <= pageLimit; page++) {
      const batch = await this.activities.listForUser(userId, {
        after: options.after,
        before: options.before,
        page,
        perPage,
      });
      pages = page;
      if (batch.length === 0) break;
      fetched += batch.length;

      for (const activity of batch) {
        const row = this.toRow(activity);
        if (!row) continue;
        await this.prisma.externalActivity.upsert({
          where: { provider_externalId: { provider: SyncProvider.strava, externalId: row.externalId } },
          create: {
            ...row,
            userId,
            provider: SyncProvider.strava,
            userProviderAccountId: account.id,
          },
          update: {
            activityType: row.activityType,
            startedAt: row.startedAt,
            elapsedSeconds: row.elapsedSeconds,
            distanceMeters: row.distanceMeters,
            startLat: row.startLat,
            startLng: row.startLng,
            endLat: row.endLat,
            endLng: row.endLng,
            payloadJson: row.payloadJson,
          },
        });
        upserted += 1;
      }

      if (batch.length < perPage) break;
    }

    return { fetched, upserted, pages };
  }

  private toRow(activity: StravaActivity) {
    if (!activity?.id || !activity.start_date) return null;
    const [startLat, startLng] = activity.start_latlng ?? [null, null];
    const [endLat, endLng] = activity.end_latlng ?? [null, null];
    return {
      externalId: String(activity.id),
      activityType: activity.sport_type ?? activity.type ?? null,
      startedAt: new Date(activity.start_date),
      elapsedSeconds: Math.max(0, Math.round(activity.elapsed_time ?? 0)),
      distanceMeters: Math.max(0, Math.round(activity.distance ?? 0)),
      startLat: startLat ?? null,
      startLng: startLng ?? null,
      endLat: endLat ?? null,
      endLng: endLng ?? null,
      payloadJson: activity as unknown as object,
    };
  }
}
