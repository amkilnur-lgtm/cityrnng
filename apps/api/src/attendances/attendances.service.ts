import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { AttendanceStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AttendancesService {
  constructor(private readonly prisma: PrismaService) {}

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

  async approve(id: string, reviewerId: string) {
    return this.transition(id, AttendanceStatus.approved, reviewerId, null);
  }

  async reject(id: string, reviewerId: string, reason?: string) {
    return this.transition(id, AttendanceStatus.rejected, reviewerId, reason ?? null);
  }

  private async transition(
    id: string,
    status: AttendanceStatus,
    reviewerId: string,
    rejectionReason: string | null,
  ) {
    const existing = await this.prisma.eventAttendance.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException({ code: "ATTENDANCE_NOT_FOUND" });
    if (existing.status !== AttendanceStatus.pending) {
      throw new ConflictException({ code: "ATTENDANCE_ALREADY_REVIEWED" });
    }
    return this.prisma.eventAttendance.update({
      where: { id },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedById: reviewerId,
        rejectionReason: status === AttendanceStatus.rejected ? rejectionReason : null,
      },
    });
  }
}
