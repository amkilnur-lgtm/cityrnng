import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { AttendanceStatus } from "@prisma/client";
import { PointsAwardsService } from "../points/points-awards.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AttendancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsAwards: PointsAwardsService,
  ) {}

  async listForEvent(eventId: string, status?: AttendanceStatus) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });

    return this.prisma.eventAttendance.findMany({
      where: { eventId, status: status ?? undefined },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true } },
        externalActivity: true,
      },
    });
  }

  /** Cross-event admin listing — useful for the admin pending-queue. */
  listAll(opts: { status?: AttendanceStatus; limit?: number } = {}) {
    return this.prisma.eventAttendance.findMany({
      where: { status: opts.status ?? undefined },
      orderBy: { createdAt: "desc" },
      take: opts.limit ?? 100,
      include: {
        user: { select: { id: true, email: true } },
        event: { select: { id: true, title: true, startsAt: true, type: true } },
        externalActivity: true,
      },
    });
  }

  async approve(id: string, reviewerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.eventAttendance.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException({ code: "ATTENDANCE_NOT_FOUND" });
      if (existing.status !== AttendanceStatus.pending) {
        throw new ConflictException({ code: "ATTENDANCE_ALREADY_REVIEWED" });
      }
      const updated = await tx.eventAttendance.update({
        where: { id },
        data: {
          status: AttendanceStatus.approved,
          reviewedAt: new Date(),
          reviewedById: reviewerId,
          rejectionReason: null,
        },
      });
      const event = await tx.event.findUniqueOrThrow({ where: { id: updated.eventId } });
      await this.pointsAwards.awardEventAttendance(updated, event, tx);
      return updated;
    });
  }

  async reject(id: string, reviewerId: string, reason?: string) {
    const existing = await this.prisma.eventAttendance.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException({ code: "ATTENDANCE_NOT_FOUND" });
    if (existing.status !== AttendanceStatus.pending) {
      throw new ConflictException({ code: "ATTENDANCE_ALREADY_REVIEWED" });
    }
    return this.prisma.eventAttendance.update({
      where: { id },
      data: {
        status: AttendanceStatus.rejected,
        reviewedAt: new Date(),
        reviewedById: reviewerId,
        rejectionReason: reason ?? null,
      },
    });
  }
}
