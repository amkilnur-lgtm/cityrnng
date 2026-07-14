import { randomUUID } from "node:crypto";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  CheckinScanResult,
  CityLocationStatus,
  Prisma,
  ScanDeviceStatus,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CheckinService, SCAN_RESULT_MESSAGE } from "./checkin.service";

const SCAN_PAGE_SIZE = 100;

@Injectable()
export class AdminCheckinService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly checkin: CheckinService,
  ) {}

  async listDevices() {
    const devices = await this.prisma.scanDevice.findMany({
      orderBy: { createdAt: "desc" },
      include: { location: { select: { name: true, city: true } } },
    });
    return devices.map((d) => ({
      id: d.id,
      label: d.label,
      status: d.status,
      locationId: d.locationId,
      locationName: d.location.name,
      locationCity: d.location.city,
      lastSeenAt: d.lastSeenAt,
      createdAt: d.createdAt,
    }));
  }

  /** Creates a device and returns the plaintext key ONCE (only its hash is stored). */
  async createDevice(input: {
    locationId: string;
    label: string;
    createdById: string;
  }) {
    const location = await this.prisma.cityLocation.findUnique({
      where: { id: input.locationId },
      select: { id: true, status: true },
    });
    if (!location) {
      throw new NotFoundException({ code: "LOCATION_NOT_FOUND" });
    }
    if (location.status !== CityLocationStatus.active) {
      throw new BadRequestException({ code: "LOCATION_NOT_ACTIVE" });
    }

    const key = CheckinService.generateDeviceKey();
    const device = await this.prisma.scanDevice.create({
      data: {
        locationId: input.locationId,
        label: input.label,
        apiKeyHash: CheckinService.hashDeviceKey(key),
        createdById: input.createdById,
      },
    });
    return { id: device.id, label: device.label, key };
  }

  async updateDevice(
    id: string,
    patch: { label?: string; status?: ScanDeviceStatus },
  ) {
    await this.getDeviceOrThrow(id);
    const data = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined),
    );
    if (Object.keys(data).length === 0) return { ok: true };
    await this.prisma.scanDevice.update({ where: { id }, data });
    return { ok: true };
  }

  /** Hard delete — cascades to the device's scan journal (`checkin_scans`).
   * Use `updateDevice(id, { status: "disabled" })` instead to retire a
   * device while keeping its history. */
  async deleteDevice(id: string) {
    await this.getDeviceOrThrow(id);
    await this.prisma.scanDevice.delete({ where: { id } });
  }

  /** Issues a new key, invalidating the old one. Returned once. */
  async rotateKey(id: string) {
    await this.getDeviceOrThrow(id);
    const key = CheckinService.generateDeviceKey();
    await this.prisma.scanDevice.update({
      where: { id },
      data: { apiKeyHash: CheckinService.hashDeviceKey(key) },
    });
    return { id, key };
  }

  /**
   * Runs a scan through the exact same pipeline a real device hits, using a
   * device row picked from the admin panel instead of an `X-Device-Key`
   * header. Lets an admin verify a scanner + a runner's code end-to-end
   * (real attendance + points on `matched`) before the physical Pi exists.
   */
  async testScan(id: string, checkinCode: string) {
    const device = await this.getDeviceOrThrow(id);
    if (device.status !== ScanDeviceStatus.active) {
      throw new BadRequestException({ code: "SCAN_DEVICE_DISABLED" });
    }
    const outcome = await this.checkin.processScan(device, {
      code: checkinCode,
      scanId: `admin-test-${randomUUID()}`,
      scannedAt: new Date().toISOString(),
    });
    return {
      result: outcome.result,
      ok:
        outcome.result === CheckinScanResult.matched ||
        outcome.result === CheckinScanResult.duplicate,
      idempotent: outcome.idempotent,
      message: SCAN_RESULT_MESSAGE[outcome.result],
    };
  }

  async listScans(filter: { deviceId?: string; locationId?: string }) {
    const where: Prisma.CheckinScanWhereInput = {
      deviceId: filter.deviceId,
      locationId: filter.locationId,
    };
    const scans = await this.prisma.checkinScan.findMany({
      where,
      orderBy: { scannedAt: "desc" },
      take: SCAN_PAGE_SIZE,
      include: {
        device: { select: { label: true } },
        location: { select: { name: true } },
        user: { select: { email: true, profile: { select: { displayName: true } } } },
        event: { select: { title: true, startsAt: true } },
      },
    });
    return scans.map((s) => ({
      id: s.id,
      result: s.result,
      scannedAt: s.scannedAt,
      receivedAt: s.receivedAt,
      deviceLabel: s.device.label,
      locationName: s.location.name,
      checkinCode: s.checkinCode,
      runner: s.user
        ? { email: s.user.email, displayName: s.user.profile?.displayName ?? null }
        : null,
      eventTitle: s.event?.title ?? null,
      eventStartsAt: s.event?.startsAt ?? null,
    }));
  }

  private async getDeviceOrThrow(id: string) {
    const device = await this.prisma.scanDevice.findUnique({ where: { id } });
    if (!device) throw new NotFoundException({ code: "SCAN_DEVICE_NOT_FOUND" });
    return device;
  }
}
