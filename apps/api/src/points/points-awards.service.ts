import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  Event,
  EventAttendance,
  EventType,
  PointActorType,
  PointDirection,
  PointReasonType,
  PointTransaction,
  Prisma,
} from "@prisma/client";
import type { Env } from "../config/env.schema";
import { PointsService } from "./points.service";

@Injectable()
export class PointsAwardsService {
  private readonly logger = new Logger(PointsAwardsService.name);

  constructor(
    private readonly points: PointsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** Welcome bonus. Idempotent per user via `signup_bonus:<userId>`. */
  async awardSignupBonus(userId: string, tx?: Prisma.TransactionClient): Promise<PointTransaction | null> {
    const amount = this.config.get("WELCOME_BONUS_POINTS", { infer: true });
    if (amount <= 0) return null;
    return this.points.post(
      {
        userId,
        direction: PointDirection.credit,
        amount,
        reasonType: PointReasonType.signup_bonus,
        idempotencyKey: `signup_bonus:${userId}`,
        actor: { type: PointActorType.system },
        comment: "Welcome to CityRNNG",
      },
      tx,
    );
  }

  /**
   * Event attendance award. Idempotent per attendance via
   * `event_attendance:<attendanceId>`. No-op (returns null) when the event is
   * not points-eligible, the computed amount is 0, or the event type is not
   * awardable in this PR (partner).
   */
  async awardEventAttendance(
    attendance: EventAttendance,
    event: Event,
    tx?: Prisma.TransactionClient,
  ): Promise<PointTransaction | null> {
    if (!event.isPointsEligible) return null;
    if (attendance.eventId !== event.id) {
      throw new Error("awardEventAttendance: attendance/event mismatch");
    }

    const reasonType = reasonTypeForEvent(event.type);
    if (!reasonType) {
      this.logger.log(
        `Event attendance award skipped for event type=${event.type} (not yet awardable)`,
      );
      return null;
    }

    const amount = this.amountForEvent(event);
    if (amount <= 0) return null;

    return this.points.post(
      {
        userId: attendance.userId,
        direction: PointDirection.credit,
        amount,
        reasonType,
        reasonRef: attendance.id,
        idempotencyKey: `event_attendance:${attendance.id}`,
        actor: { type: PointActorType.system },
      },
      tx,
    );
  }

  private amountForEvent(event: Event): number {
    if (event.basePointsAward > 0) return event.basePointsAward;
    if (event.type === EventType.regular) {
      return this.config.get("EVENT_ATTENDANCE_REGULAR_POINTS_FALLBACK", { infer: true });
    }
    if (event.type === EventType.special) {
      return this.config.get("EVENT_ATTENDANCE_SPECIAL_POINTS_FALLBACK", { infer: true });
    }
    return 0;
  }
}

/** Partner deferred: enum value exists (event_attendance_partner) but not awarded in this PR. */
function reasonTypeForEvent(type: EventType): PointReasonType | null {
  switch (type) {
    case EventType.regular:
      return PointReasonType.event_attendance_regular;
    case EventType.special:
      return PointReasonType.event_attendance_special;
    case EventType.partner:
      return null;
    default:
      return null;
  }
}
