import { BadRequestException, Injectable } from "@nestjs/common";
import { CheckinScanResult, CityLocationStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  CheckinService,
  SCAN_RESULT_MESSAGE,
} from "../integrations/checkin/checkin.service";

const RECENT_LIMIT = 20;

@Injectable()
export class LeaderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly checkin: CheckinService,
  ) {}

  /** Active starting points the leader can scan at. */
  async listLocations() {
    const locations = await this.prisma.cityLocation.findMany({
      where: { status: CityLocationStatus.active },
      orderBy: [{ city: "asc" }, { name: "asc" }],
      select: { id: true, name: true, city: true, venue: true },
    });
    return locations;
  }

  /** Run a manual leader scan through the shared check-in credit path. */
  async scan(leaderId: string, locationId: string, code: string) {
    const location = await this.prisma.cityLocation.findUnique({
      where: { id: locationId },
      select: { status: true },
    });
    if (!location || location.status !== CityLocationStatus.active) {
      throw new BadRequestException({ code: "LOCATION_NOT_ACTIVE" });
    }

    const outcome = await this.checkin.creditLeaderScan({
      locationId,
      code: code.trim(),
      leaderId,
    });
    return {
      result: outcome.result,
      ok:
        outcome.result === CheckinScanResult.matched ||
        outcome.result === CheckinScanResult.duplicate,
      message: SCAN_RESULT_MESSAGE[outcome.result],
    };
  }

  /** Recent scans at a location — a live feed for the leader's confidence. */
  async recentScans(locationId: string) {
    // Guard against a missing filter fetching every location's scans.
    if (!locationId) return [];
    const scans = await this.prisma.checkinScan.findMany({
      where: { locationId },
      orderBy: { scannedAt: "desc" },
      take: RECENT_LIMIT,
      include: {
        user: { select: { profile: { select: { displayName: true } } } },
      },
    });
    return scans.map((s) => ({
      id: s.id,
      result: s.result,
      scannedAt: s.scannedAt,
      checkinCode: s.checkinCode,
      runnerName: s.user?.profile?.displayName ?? null,
      byLeader: s.deviceId === null,
    }));
  }
}
