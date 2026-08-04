import { createHash, randomBytes } from "node:crypto";
import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import {
  AttendanceSource,
  AttendanceStatus,
  CheckinScan,
  CheckinScanResult,
  Event,
  Prisma,
  ScanDevice,
  ScanDeviceStatus,
} from "@prisma/client";
import { EventOccurrenceService } from "../../events/event-occurrence.service";
import { PointsAwardsService } from "../../points/points-awards.service";
import { PrismaService } from "../../prisma/prisma.service";
import type { ScanDto } from "./dto/scan.dto";

const DAY_MS = 86_400_000;
const MAX_SERIALIZATION_RETRIES = 3;

/** Maps an internal scan result to a short status a device (or admin test) can act on. */
export const SCAN_RESULT_MESSAGE: Record<CheckinScanResult, string> = {
  matched: "Отметили — пробежка засчитана",
  duplicate: "Уже отмечен сегодня",
  no_window: "Сейчас нет открытой пробежки на этой точке",
  unknown_code: "Код не распознан",
  error: "Ошибка обработки, попробуйте ещё раз",
};

export interface ScanOutcome {
  result: CheckinScanResult;
  /** True when this exact scan (deviceId+scanId) was already processed before. */
  idempotent: boolean;
  eventId: string | null;
  attendanceId: string | null;
  userMatched: boolean;
}

@Injectable()
export class CheckinService {
  private readonly logger = new Logger(CheckinService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly occurrences: EventOccurrenceService,
    private readonly pointsAwards: PointsAwardsService,
  ) {}

  /** Devices present a plaintext key; we only ever store/compare its hash. */
  static hashDeviceKey(rawKey: string): string {
    return createHash("sha256").update(rawKey, "utf8").digest("hex");
  }

  /** Fresh device key, shown to the admin once at creation / rotation. */
  static generateDeviceKey(): string {
    return `csk_${randomBytes(24).toString("base64url")}`;
  }

  async authenticateDevice(rawKey: string | undefined): Promise<ScanDevice> {
    if (!rawKey) {
      throw new UnauthorizedException({ code: "DEVICE_KEY_MISSING" });
    }
    const device = await this.prisma.scanDevice.findUnique({
      where: { apiKeyHash: CheckinService.hashDeviceKey(rawKey) },
    });
    if (!device || device.status !== ScanDeviceStatus.active) {
      throw new UnauthorizedException({ code: "DEVICE_NOT_AUTHORIZED" });
    }
    return device;
  }

  /**
   * Process one scan from an authenticated device. Idempotent on
   * (deviceId, scanId): a re-sent scan returns the original outcome without
   * crediting twice. Resolves the runner by their static code and the open
   * occurrence at the device's location, then creates an approved attendance
   * and awards points.
   */
  async processScan(device: ScanDevice, dto: ScanDto): Promise<ScanOutcome> {
    const scannedAt = new Date(dto.scannedAt);

    // Idempotency: replay of an already-seen scan returns the stored result.
    const prior = await this.prisma.checkinScan.findUnique({
      where: { deviceId_scanId: { deviceId: device.id, scanId: dto.scanId } },
    });
    if (prior) {
      await this.touchDevice(device.id);
      return this.toOutcome(prior, true);
    }

    const outcome = await this.resolveAndRecord({
      locationId: device.locationId,
      code: dto.code,
      scannedAt,
      deviceId: device.id,
      scanId: dto.scanId,
    });
    await this.touchDevice(device.id);
    return outcome;
  }

  /**
   * Credit a scan a leader made manually from their phone (no fixed device).
   * Same resolution + crediting path as a device scan, but authenticated by
   * the leader's session upstream and recorded with scannedByUserId for audit.
   * No offline idempotency: double-credit is already blocked by the
   * EventAttendance unique + one-per-day guard, so a re-tap is a harmless
   * `duplicate`.
   */
  async creditLeaderScan(input: {
    locationId: string;
    code: string;
    leaderId: string;
  }): Promise<ScanOutcome> {
    return this.resolveAndRecord({
      locationId: input.locationId,
      code: input.code,
      scannedAt: new Date(),
      scannedByUserId: input.leaderId,
    });
  }

  /**
   * Shared core: resolve the runner by code + the open occurrence at the
   * location, credit an approved attendance + points, and persist a
   * CheckinScan audit row. Used by both the device and the leader path.
   */
  private async resolveAndRecord(params: {
    locationId: string;
    code: string;
    scannedAt: Date;
    deviceId?: string;
    scanId?: string;
    scannedByUserId?: string;
  }): Promise<ScanOutcome> {
    const user = await this.prisma.user.findUnique({
      where: { checkinCode: params.code },
      select: { id: true },
    });

    // Only resolve an occurrence when we have a user — keeps logs clean and
    // avoids materializing an Event for an unknown code.
    const event = user
      ? await this.occurrences.findOpenCheckinOccurrence(params.locationId, params.scannedAt)
      : null;

    let result: CheckinScanResult;
    let attendanceId: string | null = null;

    if (!user) {
      result = CheckinScanResult.unknown_code;
    } else if (!event) {
      result = CheckinScanResult.no_window;
    } else {
      try {
        const outcome = await this.createAttendanceAndAward(user.id, event);
        // CheckinScan.attendanceId is unique — only the scan that CREATED the
        // attendance may reference it. A duplicate (attendance already existed)
        // records with a null link, else the second scan collides on the
        // unique and the insert throws (was a latent 500 on any re-scan whose
        // idempotency key differed — e.g. every leader re-tap).
        attendanceId = outcome.created ? outcome.attendanceId : null;
        result = outcome.created
          ? CheckinScanResult.matched
          : CheckinScanResult.duplicate;
      } catch (err) {
        const who = params.deviceId
          ? `device=${params.deviceId}`
          : `leader=${params.scannedByUserId}`;
        this.logger.error(
          `Scan processing failed for ${who} user=${user.id}: ${(err as Error).message}`,
        );
        result = CheckinScanResult.error;
      }
    }

    const scan = await this.recordScan({
      ...params,
      userId: user?.id ?? null,
      eventId: event?.id ?? null,
      attendanceId,
      result,
    });
    return this.toOutcome(scan, false);
  }

  private async recordScan(args: {
    locationId: string;
    code: string;
    scannedAt: Date;
    deviceId?: string;
    scanId?: string;
    scannedByUserId?: string;
    userId: string | null;
    eventId: string | null;
    attendanceId: string | null;
    result: CheckinScanResult;
  }): Promise<CheckinScan> {
    try {
      return await this.prisma.checkinScan.create({
        data: {
          deviceId: args.deviceId ?? null,
          locationId: args.locationId,
          scanId: args.scanId ?? null,
          scannedByUserId: args.scannedByUserId ?? null,
          checkinCode: args.code,
          userId: args.userId,
          eventId: args.eventId,
          attendanceId: args.attendanceId,
          result: args.result,
          scannedAt: args.scannedAt,
        },
      });
    } catch (err) {
      // Race: a concurrent delivery of the same (deviceId, scanId) won the
      // unique. Re-read and return the persisted row so the caller still gets
      // a coherent outcome. Only possible on the device path (both present).
      if (
        args.deviceId &&
        args.scanId &&
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        const winner = await this.prisma.checkinScan.findUnique({
          where: {
            deviceId_scanId: { deviceId: args.deviceId, scanId: args.scanId },
          },
        });
        if (winner) return winner;
      }
      throw err;
    }
  }

  /**
   * Create an approved QR attendance and award points. Mirrors the Strava
   * matcher's guards: one attendance per (event, user), at most one credited
   * event per calendar day, serializable + retry against concurrent writes.
   */
  private async createAttendanceAndAward(
    userId: string,
    event: Event,
  ): Promise<{ created: boolean; attendanceId: string | null }> {
    let attempt = 0;
    while (true) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const dayStart = new Date(event.startsAt);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart.getTime() + DAY_MS);
            const sameDay = await tx.eventAttendance.findFirst({
              where: {
                userId,
                event: { startsAt: { gte: dayStart, lt: dayEnd } },
              },
              select: { id: true },
            });
            if (sameDay) {
              // Already credited for some event today (this one or another) —
              // never double-credit.
              return { created: false, attendanceId: sameDay.id };
            }

            const now = new Date();
            const attendance = await tx.eventAttendance.create({
              data: {
                eventId: event.id,
                userId,
                source: AttendanceSource.qr_scan,
                status: AttendanceStatus.approved,
                matchedAt: now,
                reviewedAt: now,
              },
            });
            await this.pointsAwards.awardEventAttendance(attendance, event, tx);
            return { created: true, attendanceId: attendance.id };
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          if (err.code === "P2002") {
            const existing = await this.prisma.eventAttendance.findUnique({
              where: { eventId_userId: { eventId: event.id, userId } },
              select: { id: true },
            });
            return { created: false, attendanceId: existing?.id ?? null };
          }
          if (err.code === "P2034" && attempt < MAX_SERIALIZATION_RETRIES) {
            attempt += 1;
            continue;
          }
        }
        throw err;
      }
    }
  }

  private async touchDevice(deviceId: string): Promise<void> {
    try {
      await this.prisma.scanDevice.update({
        where: { id: deviceId },
        data: { lastSeenAt: new Date() },
      });
    } catch (err) {
      // Best-effort heartbeat — never fail a scan because the touch failed.
      this.logger.warn(
        `Failed to update lastSeenAt for device=${deviceId}: ${(err as Error).message}`,
      );
    }
  }

  private toOutcome(scan: CheckinScan, idempotent: boolean): ScanOutcome {
    return {
      result: scan.result,
      idempotent,
      eventId: scan.eventId,
      attendanceId: scan.attendanceId,
      userMatched: scan.userId !== null,
    };
  }
}
