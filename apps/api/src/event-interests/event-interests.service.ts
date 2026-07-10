import {
  BadRequestException,
  ConflictException,
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
import { EventOccurrenceService } from "../events/event-occurrence.service";
import { PrismaService } from "../prisma/prisma.service";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RULE_KEY_RE = /^rule:([0-9a-f-]{36}):(\d{4}-\d{2}-\d{2})$/i;

@Injectable()
export class EventInterestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly occurrences: EventOccurrenceService,
  ) {}

  /**
   * Mark the user as "going" to a given event/occurrence at a chosen
   * starting location. Idempotent — same (user, eventKey) returns the
   * existing row, refreshed to status=going if it was cancelled.
   *
   * For regular recurrence occurrences (eventKey = `rule:UUID:DATE`),
   * materializes a backing Event-row so the matcher and attendance
   * pipeline can FK to a real Event.id later.
   *
   * Rejects with EVENT_INTEREST_DATE_TAKEN if user already RSVPed to a
   * different event on the same calendar date — can't be in two places at
   * once.
   */
  async markGoing(opts: {
    userId: string;
    eventKey: string;
    locationId: string;
  }) {
    await this.assertEventExists(opts.eventKey);
    await this.assertLocationActive(opts.locationId);

    // Materialize Event-row for regular rule occurrences before recording
    // interest — matcher needs a real DB row + EventSyncRule to attribute
    // attendance back to this date.
    const ruleMatch = opts.eventKey.match(RULE_KEY_RE);
    if (ruleMatch) {
      const [, ruleId, dateStr] = ruleMatch;
      const day = new Date(`${dateStr}T00:00:00.000Z`);
      await this.occurrences.ensureMaterializedEvent(ruleId, day);
    }

    // Block double-RSVP on the same calendar date: a user can only be in
    // one place at a time. Idempotent re-RSVP to the same event still works.
    await this.assertNoConflictingInterest(opts.userId, opts.eventKey);

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

  /**
   * Returns the current user's "me" status for an event: going-interest (if any)
   * plus whether the user has been credited with attendance (points if
   * known). Returns null when there's neither interest nor attendance.
   *
   * Attendance lookup resolves the eventKey to a real Event UUID — for
   * rule occurrences that means the materialized override Event (if any
   * exists yet). When no DB row exists for a rule occurrence yet, attended
   * is automatically false (matcher hasn't run anything there).
   */
  async getForUser(userId: string, eventKey: string) {
    const row = await this.prisma.eventInterest.findUnique({
      where: { userId_eventKey: { userId, eventKey } },
    });
    const interest = row && row.status === EventInterestStatus.going ? row : null;

    const eventId = await this.resolveEventId(eventKey);
    let attended: { points: number | null } | null = null;
    if (eventId) {
      // Any credited attendance counts — QR scans and manual-admin included
      // (the old source:"sync" filter hid QR check-ins from the RSVP block).
      const attendance = await this.prisma.eventAttendance.findFirst({
        where: { userId, eventId },
      });
      if (attendance) {
        const txns = await this.prisma.pointTransaction.findMany({
          where: { userId, reasonRef: attendance.id, direction: "credit" },
          select: { amount: true },
        });
        const points = txns.reduce((sum, t) => sum + t.amount, 0);
        attended = { points: points > 0 ? points : null };
      }
    }

    if (!interest && !attended) return null;
    return { interest, attended };
  }

  /** Resolve an eventKey to the real Event UUID, if a backing row exists. */
  private async resolveEventId(eventKey: string): Promise<string | null> {
    if (UUID_RE.test(eventKey)) return eventKey;
    const ruleMatch = eventKey.match(RULE_KEY_RE);
    if (!ruleMatch) return null;
    const [, ruleId, dateStr] = ruleMatch;
    const day = new Date(`${dateStr}T00:00:00.000Z`);
    const ev = await this.prisma.event.findFirst({
      where: { recurrenceRuleId: ruleId, overridesOccurrenceAt: day },
      select: { id: true },
    });
    return ev?.id ?? null;
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

  /**
   * Список людей, идущих на конкретную точку события. Привязка по
   * `locationSlug` (из URL) → внутри резолвится в `locationId`, чтобы
   * можно было кешировать URL'ы вида /events/X/where/centr независимо
   * от UUID локации.
   *
   * Возвращает анонимизированный displayName: «Имя Ф.» (без email и
   * фамилии целиком). Email нигде не отдаём — приватность.
   */
  async listForEventAndLocation(eventKey: string, locationSlug: string) {
    const location = await this.prisma.cityLocation.findUnique({
      where: { slug: locationSlug },
      select: {
        id: true,
        slug: true,
        name: true,
        city: true,
        venue: true,
        address: true,
        lat: true,
        lng: true,
        status: true,
      },
    });
    if (!location || location.status !== CityLocationStatus.active) {
      throw new NotFoundException({ code: "LOCATION_NOT_FOUND" });
    }

    const interests = await this.prisma.eventInterest.findMany({
      where: {
        eventKey,
        locationId: location.id,
        status: EventInterestStatus.going,
      },
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      location: {
        id: location.id,
        slug: location.slug,
        name: location.name,
        city: location.city,
        venue: location.venue,
        address: location.address,
        lat: location.lat,
        lng: location.lng,
      },
      going: interests.map((i) => ({
        userId: i.user.id,
        displayName: anonymize(i.user.profile),
        createdAt: i.createdAt,
      })),
    };
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

  /**
   * Reject when user already has a going-status interest for a different
   * event on the same calendar date. Same-key re-RSVP is allowed (idempotent).
   */
  private async assertNoConflictingInterest(userId: string, eventKey: string) {
    const myDate = await this.eventKeyToDate(eventKey);
    if (!myDate) return;
    const others = await this.prisma.eventInterest.findMany({
      where: {
        userId,
        status: EventInterestStatus.going,
        NOT: { eventKey },
      },
    });
    for (const other of others) {
      const otherDate = await this.eventKeyToDate(other.eventKey);
      if (otherDate && otherDate === myDate) {
        throw new ConflictException({
          code: "EVENT_INTEREST_DATE_TAKEN",
          message: "Уже записан на другое событие в этот день.",
        });
      }
    }
  }

  /** Resolve an eventKey to its YYYY-MM-DD local date, or null if unknown. */
  private async eventKeyToDate(eventKey: string): Promise<string | null> {
    if (UUID_RE.test(eventKey)) {
      const ev = await this.prisma.event.findUnique({
        where: { id: eventKey },
        select: { startsAt: true },
      });
      return ev ? toDateKey(ev.startsAt) : null;
    }
    const ruleMatch = eventKey.match(RULE_KEY_RE);
    if (ruleMatch) return ruleMatch[2] ?? null;
    return null;
  }
}

/** YYYY-MM-DD in server local-time (matches occurrence date layouts). */
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * «Маша Иванова» → «Маша И.». Если у юзера нет имени/фамилии — берём
 * displayName как есть. Без email и без полной фамилии — приватность
 * по умолчанию.
 */
function anonymize(profile: {
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
} | null): string {
  if (!profile) return "Бегун";
  const first = profile.firstName?.trim();
  const last = profile.lastName?.trim();
  if (first && last) return `${first} ${last.slice(0, 1)}.`;
  if (first) return first;
  const display = profile.displayName?.trim();
  if (display) {
    const parts = display.split(/\s+/);
    if (parts.length >= 2 && parts[1]) {
      return `${parts[0]} ${parts[1].slice(0, 1)}.`;
    }
    return parts[0] ?? display;
  }
  return "Бегун";
}
