import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { SyncProvider } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Daily cron that purges raw Strava activity payloads older than 7 days.
 *
 * Required by Strava API Agreement §7.1: "No Strava Data shall remain in
 * your cache longer than seven days."
 *
 * What's removed: ExternalActivity rows where provider=strava and
 * created_at is older than 7 days. The matcher has already turned matched
 * activities into our own EventAttendance + PointTransaction records,
 * which are our derived data (not Strava cache) and may be retained.
 *
 * On EventAttendance.externalActivityId — the FK is SetNull on delete, so
 * pre-existing attendance rows stay valid; they just lose the pointer to
 * the deleted raw activity.
 */
@Injectable()
export class StravaCachePurgeService {
  private readonly logger = new Logger(StravaCachePurgeService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: "strava-cache-purge" })
  async purgeOldActivities(): Promise<void> {
    await this.run();
  }

  /** Public entry-point — also callable from tests or admin trigger. */
  async run(): Promise<{ deleted: number }> {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await this.prisma.externalActivity.deleteMany({
      where: {
        provider: SyncProvider.strava,
        ingestedAt: { lt: cutoff },
      },
    });
    if (result.count > 0) {
      this.logger.log(
        `Purged ${result.count} Strava ExternalActivity rows older than ${cutoff.toISOString()}`,
      );
    }
    return { deleted: result.count };
  }
}
