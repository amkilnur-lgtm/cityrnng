import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  CityLocationStatus,
  EventInterestStatus,
  EventStatus,
  Prisma,
  RecurrenceRuleStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RULE_KEY_RE = /^rule:([0-9a-f-]{36}):(\d{4}-\d{2}-\d{2})$/i;

@Injectable()
export class EventInterestsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mark the user as "going" to a given event/occurrence at a chosen
   * starting location. Idempotent — same (user, eventKey) returns the
   * existing row, refreshed to status=going if it was cancelled.
   */
  async markGoing(opts: {
    userId: string;
    eventKey: string;
    locationId: string;
  }) {
    await this.assertEventExists(opts.eventKey);
    await this.assertLocationActive(opts.locationId);

    const existing = await this.prisma.eventInterest.findUnique({
      where: { userId_eventKey: { userId: opts.userId, eventKey: opts.eventKey } },
    });

    if (existing) {
      return this.prisma.eventInterest.update({
        where: { id: existing.id },
        data: {
          locationId: opts.locationId,
          status: EventInterestStatus.going,
          cancelledAt: null,
        },
      });
    }

    return this.prisma.eventInterest.create({
      data: {
        userId: opts.userId,
        eventKey: opts.eventKey,
        locationId: opts.locationId,
        status: EventInterestStatus.going,
      },
    });
  }

  /** Cancel the user's RSVP for the given event. Idempotent — no-op when missing or already cancelled. */
  async cancel(userId: string, eventKey: string) {
    await this.prisma.eventInterest.updateMany({
      where: { userId, eventKey, status: EventInterestStatus.going },
      data: {
        status: EventInterestStatus.cancelled,
        cancelledAt: new Date(),
      },
    });
    return { ok: true };
  }

  /** Returns the current user's interest for an event, or null. */
  async getForUser(userId: string, eventKey: string) {
    const row = await this.prisma.eventInterest.findUnique({
      where: { userId_eventKey: { userId, eventKey } },
    });
    if (!row || row.status !== EventInterestStatus.going) return null;
    return row;
  }

  /** Public count of "going" RSVPs for an event, broken down by location. */
  async countByLocation(eventKey: string) {
    const rows = await this.prisma.eventInterest.groupBy({
      by: ["locationId"],
      where: { eventKey, status: EventInterestStatus.going },
      _count: { _all: true },
    });
    return rows.map((r) => ({ locationId: r.locationId, count: r._count._all }));
  }

  // -- helpers --

  private async assertEventExists(eventKey: string) {
    if (UUID_RE.test(eventKey)) {
      const ev = await this.prisma.event.findUnique({ where: { id: eventKey } });
      if (!ev) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
      if (ev.status !== EventStatus.published) {
        throw new BadRequestException({ code: "EVENT_NOT_OPEN" });
      }
      return;
    }

    const ruleMatch = eventKey.match(RULE_KEY_RE);
    if (!ruleMatch) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });

    const [, ruleId] = ruleMatch;
    const rule = await this.prisma.eventRecurrenceRule.findUnique({
      where: { id: ruleId },
    });
    if (!rule || rule.status !== RecurrenceRuleStatus.active) {
      throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    }
    // Date validity / weekday match is enforced by EventOccurrenceService.
    // For RSVP we keep it permissive — the synthetic id was emitted by the
    // listing endpoint, so trust that it's a real occurrence.
  }

  private async assertLocationActive(locationId: string) {
    const loc = await this.prisma.cityLocation.findUnique({
      where: { id: locationId },
    });
    if (!loc || loc.status !== CityLocationStatus.active) {
      throw new NotFoundException({ code: "LOCATION_NOT_FOUND" });
    }
  }
}
