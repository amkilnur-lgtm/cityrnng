import { Injectable, Logger } from "@nestjs/common";
import { SyncProvider } from "@prisma/client";
import { AttendanceMatcherService } from "../../attendances/attendance-matcher.service";
import { PrismaService } from "../../prisma/prisma.service";
import { StravaAccountsService } from "./strava-accounts.service";
import { StravaActivitiesService } from "./strava-activities.service";
import { StravaApiClient } from "./strava-api.client";
import { StravaIngestionService } from "./strava-ingestion.service";
import type { StravaWebhookEvent } from "./types";

// Tight match-window around the activity start; matcher only needs to
// look at events that overlap this range, not the whole user history.
// 6h either side covers any event window even with our 30-min buffer.
const WEBHOOK_MATCH_WINDOW_MS = 6 * 60 * 60 * 1000;

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
    private readonly accounts: StravaAccountsService,
    private readonly activities: StravaActivitiesService,
    private readonly api: StravaApiClient,
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
      await this.handleActivityDelete(user.id, event.object_id);
      return;
    }

    // create or update — fetch the activity fresh and re-ingest, then match
    // only within a window around the activity's *start time*. Open-ended
    // scans are wasteful for users with long history.
    const externalId = String(event.object_id);
    await this.ingestion.ingestSingleActivity(user.id, externalId);

    // Center the window on the activity's real startedAt, NOT on
    // event.event_time. event_time is when the activity was created/uploaded
    // on Strava, which can be hours — or the next morning — after the run.
    // An evening run uploaded the next day would otherwise get a window that
    // no longer overlaps the event, and the credit is silently lost (and the
    // raw activity is purged after 7 days, so it can't be recovered later).
    // Fall back to event_time only if the row somehow isn't found.
    const ingested = await this.prisma.externalActivity.findUnique({
      where: {
        provider_externalId: { provider: SyncProvider.strava, externalId },
      },
      select: { startedAt: true },
    });
    const centerMs = ingested
      ? ingested.startedAt.getTime()
      : event.event_time * 1000;
    await this.matcher.matchForUser(user.id, {
      after: new Date(centerMs - WEBHOOK_MATCH_WINDOW_MS),
      before: new Date(centerMs + WEBHOOK_MATCH_WINDOW_MS),
    });
  }

  private async handleActivityDelete(userId: string, stravaActivityId: number): Promise<void> {
    const externalId = String(stravaActivityId);
    const row = await this.prisma.externalActivity.findUnique({
      where: { provider_externalId: { provider: SyncProvider.strava, externalId } },
      select: { id: true },
    });
    if (!row) return;

    // Defense against forged delete events: Strava doesn't sign webhook
    // payloads, so any caller knowing our callback URL could ask us to wipe
    // an activity. Confirm the deletion with Strava using the owner's token
    // before destroying our cached row + dependent attendances. If Strava
    // returns the activity, it's still there — reject the delete and warn.
    try {
      const upstream = await this.activities.fetchSingle(userId, externalId);
      if (upstream && upstream.id) {
        this.logger.warn(
          `Rejecting webhook delete for activity ${externalId} — upstream still has it (likely forged event)`,
        );
        return;
      }
    } catch (err) {
      // Strava returned 4xx/5xx — assume the activity really is gone or
      // inaccessible. We surface the error class in logs but proceed with
      // delete, because keeping stale cache when the user can no longer
      // see the activity is worse than the (very small) false-delete risk.
      this.logger.log(
        `Delete-verify failed for ${externalId} (treated as confirmed): ${(err as Error).message}`,
      );
    }

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

    // Defense against forged deauth events: re-check the stored access
    // token against Strava. If it still works, the revoke didn't actually
    // happen — log and skip. Only if Strava confirms (auth failure) do we
    // mirror the disconnect.
    try {
      const token = await this.accounts.getFreshAccessToken(user.id);
      await this.api.getAthlete(token);
      this.logger.warn(
        `Rejecting athlete revoke webhook for user ${user.id} — token still works upstream (likely forged event)`,
      );
      return;
    } catch (err) {
      // getFreshAccessToken throws NotFoundException if there's no live
      // account left (already disconnected, idempotent). Any upstream
      // 401 from getAthlete is also surfaced as Internal/Unauthorized
      // here — treat both as "deauth confirmed" and proceed.
      this.logger.log(
        `Deauth-verify failed for user ${user.id} (treated as confirmed): ${(err as Error).message}`,
      );
    }

    // Mirror Strava's revoke by running the full disconnect: hard-delete
    // the UserProviderAccount row + purge derived data (ExternalActivity,
    // EventAttendance). The token revoke call inside disconnect() will
    // probably 401 (Strava already revoked), but it logs+swallows that.
    await this.accounts.disconnect(user.id);
    this.logger.log(`Disconnected user ${user.id} after Strava athlete revoke webhook`);
  }

  private async findUserByAthleteId(stravaAthleteId: number): Promise<{ id: string } | null> {
    const account = await this.prisma.userProviderAccount.findFirst({
      where: {
        provider: SyncProvider.strava,
        providerUserId: String(stravaAthleteId),
      },
      select: { userId: true },
    });
    return account ? { id: account.userId } : null;
  }
}
