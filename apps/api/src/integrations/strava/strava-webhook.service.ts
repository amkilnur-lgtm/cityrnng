import { Injectable, Logger } from "@nestjs/common";
import { SyncProvider } from "@prisma/client";
import { AttendanceMatcherService } from "../../attendances/attendance-matcher.service";
import { PrismaService } from "../../prisma/prisma.service";
import { StravaIngestionService } from "./strava-ingestion.service";
import type { StravaWebhookEvent } from "./types";

/**
 * Processes Strava push-subscription webhook events.
 *
 * Flow per event:
 *   create / update — fetch activity by id, ingest (upsert) into our DB,
 *     then run the matcher for that user so points credit on the fly.
 *   delete         — remove the cached ExternalActivity and any sync-source
 *     EventAttendance rows tied to it. Points are NOT reversed (audit trail).
 *
 * Athlete-scoped events (object_type=athlete with updates.authorized=false)
 * are also handled: that's Strava telling us the user revoked access on
 * their side, so we mirror our local "disconnected" state.
 *
 * The controller acknowledges Strava immediately (200) and queues this
 * processing fire-and-forget so we never block the webhook ack with HTTP
 * round-trips that could time out.
 */
@Injectable()
export class StravaWebhookService {
  private readonly logger = new Logger(StravaWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ingestion: StravaIngestionService,
    private readonly matcher: AttendanceMatcherService,
  ) {}

  async handle(event: StravaWebhookEvent): Promise<void> {
    try {
      if (event.object_type === "activity") {
        await this.handleActivity(event);
        return;
      }
      if (event.object_type === "athlete") {
        await this.handleAthlete(event);
        return;
      }
      this.logger.warn(`Ignoring unknown object_type=${event.object_type}`);
    } catch (err) {
      // Strava already got its 200 — log the failure so we can investigate.
      this.logger.error(
        `Webhook handler failed for object=${event.object_type} id=${event.object_id} aspect=${event.aspect_type}: ${(err as Error).message}`,
      );
    }
  }

  private async handleActivity(event: StravaWebhookEvent): Promise<void> {
    const user = await this.findUserByAthleteId(event.owner_id);
    if (!user) {
      this.logger.warn(`Webhook for unknown Strava athlete ${event.owner_id} — skipping`);
      return;
    }

    if (event.aspect_type === "delete") {
      await this.handleActivityDelete(event.object_id);
      return;
    }

    // create or update — fetch the activity fresh and re-ingest. The matcher
    // only needs to look at this user, scoped tight to the activity's start
    // window (±a few minutes) for cheapness.
    const externalId = String(event.object_id);
    await this.ingestion.ingestSingleActivity(user.id, externalId);
    // Match only this user; bounds covering today are enough — explicit dates
    // aren't critical since matchForUser will scan their activities anyway,
    // and we just inserted this one. Avoid open-ended scans.
    await this.matcher.matchForUser(user.id);
  }

  private async handleActivityDelete(stravaActivityId: number): Promise<void> {
    const externalId = String(stravaActivityId);
    const row = await this.prisma.externalActivity.findUnique({
      where: { provider_externalId: { provider: SyncProvider.strava, externalId } },
      select: { id: true },
    });
    if (!row) return;
    // Remove attendances first (FK constraint allows SetNull but we want full
    // cleanup), then the cached activity itself. Points are not reversed —
    // we treat them as our derived audit (see Strava compliance PR #108).
    await this.prisma.$transaction([
      this.prisma.eventAttendance.deleteMany({
        where: { externalActivityId: row.id, source: "sync" },
      }),
      this.prisma.externalActivity.delete({ where: { id: row.id } }),
    ]);
    this.logger.log(`Deleted ExternalActivity ${externalId} after Strava webhook`);
  }

  private async handleAthlete(event: StravaWebhookEvent): Promise<void> {
    // Strava sends this when an athlete revokes app authorization.
    if (event.updates?.authorized !== false && event.updates?.authorized !== "false") {
      return;
    }
    const user = await this.findUserByAthleteId(event.owner_id);
    if (!user) return;
    // Mark our local account as disconnected. We don't call the full
    // disconnect() flow (which deletes data + revokes again) because Strava
    // already revoked on their side. Just clear our tokens.
    await this.prisma.userProviderAccount.updateMany({
      where: {
        userId: user.id,
        provider: SyncProvider.strava,
        disconnectedAt: null,
      },
      data: {
        disconnectedAt: new Date(),
        accessTokenEncrypted: null,
        refreshTokenEncrypted: null,
        tokenExpiresAt: null,
        scope: null,
      },
    });
    this.logger.log(`Marked user ${user.id} as Strava-disconnected after athlete revoke webhook`);
  }

  private async findUserByAthleteId(stravaAthleteId: number): Promise<{ id: string } | null> {
    const account = await this.prisma.userProviderAccount.findFirst({
      where: {
        provider: SyncProvider.strava,
        providerUserId: String(stravaAthleteId),
        disconnectedAt: null,
      },
      select: { userId: true },
    });
    return account ? { id: account.userId } : null;
  }
}
