import { Injectable, NotFoundException } from "@nestjs/common";
import {
  CityLocation,
  CityLocationStatus,
  Event,
  EventRecurrenceRule,
  EventStatus,
  EventSyncRule,
  EventType,
  Prisma,
  RecurrenceRuleStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { mapEventPublic, publicSyncRuleInclude } from "./events.service";

/**
 * Uniform shape for both materialized recurrence occurrences and explicit
 * standalone events. Frontend doesn't need to know which is which.
 *
 * `id` is a real UUID for explicit events; for materialized occurrences it's
 * a synthetic deterministic string `rule:<ruleId>:<dateISO>` so the frontend
 * can still link/key by it (and a future detail endpoint can resolve back).
 */
export type OccurrenceLocation = {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
};

export type MaterializedEvent = {
  id: string;
  isMaterialized: boolean;
  title: string;
  type: EventType;
  status: EventStatus;
  startsAt: Date;
  endsAt: Date;
  isPointsEligible: boolean;
  basePointsAward: number;
  description: string | null;
  locationName: string | null;
  locationAddress: string | null;
  locationLat: number | null;
  locationLng: number | null;
  capacity: number | null;
  registrationOpenAt: Date | null;
  registrationCloseAt: Date | null;
  recurrenceRuleId: string | null;
  overridesOccurrenceAt: Date | null;
  locations: OccurrenceLocation[];
};

const DAY_MS = 86_400_000;

/**
 * QR check-in window around a regular occurrence. A runner may scan from
 * CHECKIN_OPEN_BEFORE_MS before the start until CHECKIN_OPEN_AFTER_MS after
 * the end — covers early arrivals and stragglers without crediting random
 * mid-day scans.
 */
const CHECKIN_OPEN_BEFORE_MS = 60 * 60_000;
const CHECKIN_OPEN_AFTER_MS = 30 * 60_000;

const ruleInclude = Prisma.validator<Prisma.EventRecurrenceRuleDefaultArgs>()({
  include: {
    locations: {
      where: { location: { status: CityLocationStatus.active } },
      include: {
        location: {
          include: {
            paceGroups: {
              orderBy: [{ distanceKm: "asc" }, { paceSecondsPerKm: "asc" }],
            },
          },
        },
      },
    },
  },
});
type RuleWithLocations = Prisma.EventRecurrenceRuleGetPayload<typeof ruleInclude>;

const explicitInclude = Prisma.validator<Prisma.EventDefaultArgs>()({
  include: {
    syncRule: {
      include: {
        locations: {
          where: { location: { status: CityLocationStatus.active } },
          include: { location: true },
        },
      },
    },
  },
});
type ExplicitEvent = Prisma.EventGetPayload<typeof explicitInclude>;

const RULE_OCCURRENCE_ID = /^rule:([0-9a-f-]{36}):(\d{4}-\d{2}-\d{2})$/i;

@Injectable()
export class EventOccurrenceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve a synthetic `rule:<UUID>:<YYYY-MM-DD>` id back to an event-shaped
   * payload — same shape as `EventsService.getByIdOrThrow`. If an explicit
   * override exists for that occurrence, it wins; otherwise we materialize
   * straight from the rule. Returns 404 for malformed ids, unknown rules,
   * dates that don't fall on the rule's weekday, or dates outside the
   * rule's active range.
   */
  async getRuleOccurrenceById(id: string) {
    const match = id.match(RULE_OCCURRENCE_ID);
    if (!match) throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    const [, ruleId, dateStr] = match;

    const rule = await this.prisma.eventRecurrenceRule.findUnique({
      where: { id: ruleId },
      ...ruleInclude,
    });
    if (!rule || rule.status !== RecurrenceRuleStatus.active) {
      throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    }

    const startsAt = this.composeOccurrence(rule, dateStr);
    if (!startsAt || startsAt.getDay() !== rule.dayOfWeek) {
      throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    }
    if (startsAt < rule.startsFromDate) {
      throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    }
    // Compare by calendar day, not exact instant — endsAtDate is always
    // stored as UTC midnight, but startsAt carries the rule's timeOfDay, so
    // an evening occurrence on the last valid day would otherwise look
    // "past" its own end date and 404 (see fix in listInRange for the twin bug).
    if (rule.endsAtDate && this.dayOnly(startsAt) > rule.endsAtDate) {
      throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
    }

    // Override (explicit Event row tied to this rule + date) takes precedence.
    const override = await this.prisma.event.findFirst({
      where: {
        recurrenceRuleId: rule.id,
        overridesOccurrenceAt: this.dayOnly(startsAt),
      },
      include: { syncRule: { include: publicSyncRuleInclude.include } },
    });
    // Public id stays the synthetic rule-key even when an override exists —
    // override's UUID is an internal detail (matcher/EventAttendance FK).
    // EventInterest keys, /events list ids, and detail URLs all use the
    // rule-key as the single canonical id for any rule occurrence.
    if (override) return { ...mapEventPublic(override), id };

    // Collect same-day exclusions from any published explicit event whose
    // excludesRegularLocationIds names a CityLocation. Those locations are
    // dropped from this rule occurrence's starting points (their runners
    // are at the special event instead).
    const sameDayStart = this.dayOnly(startsAt);
    const sameDayEnd = new Date(sameDayStart.getTime() + DAY_MS);
    const sameDayExplicits = await this.prisma.event.findMany({
      where: {
        status: EventStatus.published,
        startsAt: { gte: sameDayStart, lt: sameDayEnd },
        NOT: { excludesRegularLocationIds: { equals: [] } },
      },
      select: { excludesRegularLocationIds: true },
    });
    const excludedIds = new Set<string>();
    for (const e of sameDayExplicits) {
      for (const lid of e.excludesRegularLocationIds) excludedIds.add(lid);
    }
    const visibleLocations = rule.locations.filter(
      (rl) => !excludedIds.has(rl.location.id),
    );

    // No override — return the materialized rule occurrence in the same
    // shape the public /events endpoint serves.
    const endsAt = new Date(startsAt.getTime() + rule.durationMinutes * 60_000);
    return {
      id,
      title: rule.title,
      slug: `rule-${rule.id}-${dateStr}`,
      description: null,
      distanceLabel: null,
      type: rule.type,
      status: EventStatus.published,
      startsAt,
      endsAt,
      locationName: null,
      locationAddress: null,
      locationLat: null,
      locationLng: null,
      capacity: null,
      registrationOpenAt: null,
      registrationCloseAt: null,
      isPointsEligible: rule.isPointsEligible,
      basePointsAward: rule.basePointsAward,
      syncRule: {
        locations: visibleLocations.map((rl) => ({
          id: rl.location.id,
          name: rl.location.name,
          city: rl.location.city,
          lat: rl.location.lat,
          lng: rl.location.lng,
          radiusMeters: null,
          paceGroups: rl.location.paceGroups.map((pg) => ({
            id: pg.id,
            distanceKm: pg.distanceKm,
            paceSecondsPerKm: pg.paceSecondsPerKm,
            pacerName: pg.pacerName,
          })),
        })),
      },
    };
  }

  /**
   * Idempotently ensure a real Event-row exists for a regular recurrence's
   * occurrence on a given calendar day. Needed because EventAttendance and
   * EventSyncRule both FK to Event by UUID — virtual `rule:UUID:DATE`
   * occurrences need a backing row before the matcher can write attendance.
   *
   * Behavior:
   *   - returns existing override Event when found
   *   - otherwise creates an Event tagged with `recurrenceRuleId` +
   *     `overridesOccurrenceAt` and a copy of the rule's locations as an
   *     EventSyncRule, so the matcher picks it up automatically.
   *   - autoApprove=true so check-ins credit points without manual
   *     review (consistent with how admin-created events with locations work).
   *
   * Called from two places:
   *   - EventInterestsService.markGoing when a user RSVPs to a rule occurrence
   *   - CheckinService when a QR scan lands in a rule occurrence's window
   */
  async ensureMaterializedEvent(
    ruleId: string,
    occurrenceDate: Date,
  ): Promise<Event> {
    const day = this.dayOnly(occurrenceDate);
    const existing = await this.prisma.event.findFirst({
      where: { recurrenceRuleId: ruleId, overridesOccurrenceAt: day },
    });
    if (existing) return existing;

    const rule = await this.prisma.eventRecurrenceRule.findUnique({
      where: { id: ruleId },
      ...ruleInclude,
    });
    if (!rule || rule.status !== RecurrenceRuleStatus.active) {
      throw new NotFoundException({ code: "RECURRENCE_RULE_NOT_FOUND" });
    }
    const dateStr = day.toISOString().slice(0, 10);
    const startsAt = this.composeOccurrence(rule, dateStr);
    if (!startsAt) {
      throw new NotFoundException({ code: "RECURRENCE_OCCURRENCE_INVALID" });
    }
    if (startsAt.getDay() !== rule.dayOfWeek) {
      throw new NotFoundException({ code: "RECURRENCE_OCCURRENCE_INVALID" });
    }
    const endsAt = new Date(startsAt.getTime() + rule.durationMinutes * 60_000);

    // Apply same-day exclusions — special events with excludesRegularLocationIds
    // pull those locations OUT of this rule's occurrence for the date. Without
    // this, the matcher's geofence on a special's location double-credits the
    // user against the regular Wednesday too (issue caught 2026-05-26).
    const dayStart = this.dayOnly(startsAt);
    const dayEnd = new Date(dayStart.getTime() + DAY_MS);
    const sameDayExplicits = await this.prisma.event.findMany({
      where: {
        status: EventStatus.published,
        startsAt: { gte: dayStart, lt: dayEnd },
        NOT: { excludesRegularLocationIds: { equals: [] } },
      },
      select: { excludesRegularLocationIds: true },
    });
    const excludedIds = new Set<string>();
    for (const e of sameDayExplicits) {
      for (const id of e.excludesRegularLocationIds) excludedIds.add(id);
    }
    const ruleLocations = rule.locations.filter(
      (rl) => !excludedIds.has(rl.locationId),
    );
    if (ruleLocations.length === 0) {
      // All locations are pulled into specials — regular doesn't run today.
      // No point materializing an Event with empty SyncRule (matcher would
      // never match anyway, but it'd still show as an empty card).
      throw new NotFoundException({ code: "REGULAR_OCCURRENCE_FULLY_EXCLUDED" });
    }

    // Slug must be unique on Event; "mat-" prefix marks materialized rows
    // visually and keeps the format short. Truncated rule prefix avoids
    // hitting 200 char limit.
    const slug = `mat-${rule.id.slice(0, 8)}-${dateStr}`;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const event = await tx.event.create({
          data: {
            title: rule.title,
            slug,
            type: rule.type,
            status: EventStatus.published,
            startsAt,
            endsAt,
            isPointsEligible: rule.isPointsEligible,
            basePointsAward: rule.basePointsAward,
            createdById: rule.createdById,
            recurrenceRuleId: rule.id,
            overridesOccurrenceAt: day,
          },
        });
        // SyncRule windows are placeholder — the matcher reads from
        // event.startsAt/endsAt ±30min, not from these fields (see PR #100).
        // DTO still requires them, so we keep them aligned for completeness.
        await tx.eventSyncRule.create({
          data: {
            eventId: event.id,
            windowStartsAt: new Date(startsAt.getTime() - 30 * 60_000),
            windowEndsAt: new Date(endsAt.getTime() + 30 * 60_000),
            autoApprove: true,
            locations: {
              create: ruleLocations.map((rl) => ({
                locationId: rl.locationId,
              })),
            },
          },
        });
        return event;
      });
    } catch (err) {
      // Race: two requests materialized at the same time. Re-read and
      // return the winning row (unique on recurrenceRuleId+date).
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        const winner = await this.prisma.event.findFirst({
          where: { recurrenceRuleId: ruleId, overridesOccurrenceAt: day },
        });
        if (winner) return winner;
      }
      throw err;
    }
  }

  /**
   * Find the points-eligible regular occurrence at `locationId` whose check-in
   * window is open at `at`, and return its materialized Event row (creating it
   * if needed). Returns null when no occurrence is open right now. Used by the
   * QR check-in flow — a runbase scanner is bound to one location, so we only
   * consider rules attached to it on the current weekday.
   */
  async findOpenCheckinOccurrence(
    locationId: string,
    at: Date,
  ): Promise<Event | null> {
    const rules = await this.prisma.eventRecurrenceRule.findMany({
      where: {
        status: RecurrenceRuleStatus.active,
        isPointsEligible: true,
        dayOfWeek: at.getDay(),
        startsFromDate: { lte: at },
        OR: [{ endsAtDate: null }, { endsAtDate: { gte: this.dayOnly(at) } }],
        locations: {
          some: {
            locationId,
            location: { status: CityLocationStatus.active },
          },
        },
      },
    });

    const open: { rule: EventRecurrenceRule; start: Date }[] = [];
    for (const rule of rules) {
      const start = this.composeOccurrence(rule, this.localDateStr(at));
      if (!start) continue;
      const end = new Date(start.getTime() + rule.durationMinutes * 60_000);
      const openFrom = start.getTime() - CHECKIN_OPEN_BEFORE_MS;
      const openUntil = end.getTime() + CHECKIN_OPEN_AFTER_MS;
      if (at.getTime() >= openFrom && at.getTime() <= openUntil) {
        open.push({ rule, start });
      }
    }
    if (open.length === 0) return null;

    // If several windows overlap, prefer special over regular, then the
    // occurrence whose start is nearest to the scan time.
    const typeOrder: Record<EventType, number> = {
      [EventType.special]: 0,
      [EventType.partner]: 1,
      [EventType.regular]: 2,
    };
    open.sort((a, b) => {
      const t = typeOrder[a.rule.type] - typeOrder[b.rule.type];
      if (t !== 0) return t;
      return (
        Math.abs(a.start.getTime() - at.getTime()) -
        Math.abs(b.start.getTime() - at.getTime())
      );
    });

    const chosen = open[0]!;
    return this.ensureMaterializedEvent(chosen.rule.id, chosen.start);
  }

  private localDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  private composeOccurrence(
    rule: EventRecurrenceRule,
    dateStr: string,
  ): Date | null {
    const [h, m] = rule.timeOfDay.split(":").map((s) => Number.parseInt(s, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(h, m, 0, 0);
    return d;
  }

  async listUpcoming(weeksAhead = 8): Promise<MaterializedEvent[]> {
    const now = new Date();
    const horizon = new Date(now.getTime() + weeksAhead * 7 * DAY_MS);
    return this.listInRange(now, horizon);
  }

  /**
   * Generalized version of listUpcoming — materializes events in any
   * [from, to] window, including past dates. Used by /me/timeline to show
   * the runner's current month grid (which spans both past and future weeks).
   */
  async listInRange(from: Date, to: Date): Promise<MaterializedEvent[]> {
    const [rules, explicits] = await Promise.all([
      this.prisma.eventRecurrenceRule.findMany({
        where: {
          status: RecurrenceRuleStatus.active,
          startsFromDate: { lte: to },
          OR: [{ endsAtDate: null }, { endsAtDate: { gte: from } }],
        },
        ...ruleInclude,
      }),
      this.prisma.event.findMany({
        where: {
          status: EventStatus.published,
          startsAt: { gte: from, lte: to },
        },
        ...explicitInclude,
      }),
    ]);

    // Split explicit events: overrides keyed by rule+date, vs standalones
    const overrides = new Map<string, ExplicitEvent>();
    const standalones: ExplicitEvent[] = [];
    for (const e of explicits) {
      if (e.recurrenceRuleId && e.overridesOccurrenceAt) {
        overrides.set(this.overrideKey(e.recurrenceRuleId, e.overridesOccurrenceAt), e);
      } else {
        standalones.push(e);
      }
    }

    // Exclusion map: YYYY-MM-DD → set of CityLocation ids whose participants
    // are at a special event that day instead of the regular Wednesday.
    // Union across all explicit events on that date.
    const exclusionsByDate = new Map<string, Set<string>>();
    for (const e of explicits) {
      if (e.excludesRegularLocationIds.length === 0) continue;
      const key = this.dayOnly(e.startsAt).toISOString().slice(0, 10);
      const set = exclusionsByDate.get(key) ?? new Set<string>();
      for (const id of e.excludesRegularLocationIds) set.add(id);
      exclusionsByDate.set(key, set);
    }

    const out: MaterializedEvent[] = [];

    // Materialize each rule's occurrences within window, replacing with override when present
    for (const rule of rules) {
      let cursor = this.firstOccurrenceOnOrAfter(rule, from);
      // endsAtDate is stored as UTC midnight, but cursor carries the rule's
      // timeOfDay — push the boundary to the end of that calendar day so an
      // evening occurrence on the last valid date isn't excluded (a rule
      // ending "today" produced zero cells for today's own occurrence).
      const ruleEnd =
        rule.endsAtDate && rule.endsAtDate < to
          ? new Date(rule.endsAtDate.getTime() + DAY_MS - 1)
          : to;
      while (cursor <= ruleEnd) {
        const key = this.overrideKey(rule.id, this.dayOnly(cursor));
        const override = overrides.get(key);
        if (override) {
          // Same rationale as getRuleOccurrenceById: when an override Event
          // exists for a rule occurrence, the public id is still the rule-key.
          // Override UUID stays internal so all UI references (lists, detail
          // URLs, EventInterest.eventKey) line up on a single canonical id.
          const dateKey = this.dayOnly(cursor).toISOString().slice(0, 10);
          out.push({
            ...this.toMaterialized(override, rule),
            id: `rule:${rule.id}:${dateKey}`,
          });
        } else {
          const dateKey = cursor.toISOString().slice(0, 10);
          const excluded = exclusionsByDate.get(dateKey) ?? null;
          const materialized = this.fromRule(rule, cursor, excluded);
          // Drop the regular occurrence entirely if every location was
          // pulled into a same-day special.
          if (materialized.locations.length > 0) out.push(materialized);
        }
        cursor = new Date(cursor.getTime() + 7 * DAY_MS);
      }
    }

    // Add additive specials (standalone explicit events not tied to any rule)
    for (const e of standalones) {
      out.push(this.toMaterialized(e, null));
    }

    // Sort by time ascending; on the same start time, specials surface above
    // partner above regular so the more interesting card lands first.
    const typeOrder: Record<EventType, number> = {
      [EventType.special]: 0,
      [EventType.partner]: 1,
      [EventType.regular]: 2,
    };
    out.sort((a, b) => {
      const dt = a.startsAt.getTime() - b.startsAt.getTime();
      if (dt !== 0) return dt;
      return typeOrder[a.type] - typeOrder[b.type];
    });
    return out;
  }

  /**
   * First date strictly on/after `from` whose day-of-week matches the rule
   * and time-of-day equals rule.timeOfDay. Honours rule.startsFromDate.
   */
  private firstOccurrenceOnOrAfter(rule: EventRecurrenceRule, from: Date): Date {
    const startBase = rule.startsFromDate > from ? rule.startsFromDate : from;
    let date = new Date(startBase);
    // Roll forward to matching weekday
    while (date.getDay() !== rule.dayOfWeek) {
      date = new Date(date.getTime() + DAY_MS);
    }
    const [h, m] = rule.timeOfDay.split(":").map((s) => Number.parseInt(s, 10));
    date.setHours(h, m, 0, 0);
    if (date < from) {
      date = new Date(date.getTime() + 7 * DAY_MS);
    }
    return date;
  }

  /** YYYY-MM-DD, used to dedupe materialized vs override on the same calendar day. */
  private dayOnly(d: Date): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  private overrideKey(ruleId: string, occurrenceDate: Date): string {
    const iso = occurrenceDate.toISOString().slice(0, 10);
    return `${ruleId}:${iso}`;
  }

  private fromRule(
    rule: RuleWithLocations,
    startsAt: Date,
    excludedLocationIds: Set<string> | null = null,
  ): MaterializedEvent {
    const endsAt = new Date(startsAt.getTime() + rule.durationMinutes * 60_000);
    const dateKey = startsAt.toISOString().slice(0, 10);
    const visibleLocations = rule.locations.filter(
      (rl) => !excludedLocationIds || !excludedLocationIds.has(rl.location.id),
    );
    return {
      id: `rule:${rule.id}:${dateKey}`,
      isMaterialized: true,
      title: rule.title,
      type: rule.type,
      status: EventStatus.published,
      startsAt,
      endsAt,
      isPointsEligible: rule.isPointsEligible,
      basePointsAward: rule.basePointsAward,
      description: null,
      locationName: null,
      locationAddress: null,
      locationLat: null,
      locationLng: null,
      capacity: null,
      registrationOpenAt: null,
      registrationCloseAt: null,
      recurrenceRuleId: rule.id,
      overridesOccurrenceAt: null,
      locations: visibleLocations.map((rl) => ({
        id: rl.location.id,
        name: rl.location.name,
        city: rl.location.city,
        lat: rl.location.lat,
        lng: rl.location.lng,
      })),
    };
  }

  private toMaterialized(
    event: ExplicitEvent,
    rule: RuleWithLocations | null,
  ): MaterializedEvent {
    const fromRule = rule
      ? rule.locations.map((rl) => ({
          id: rl.location.id,
          name: rl.location.name,
          city: rl.location.city,
          lat: rl.location.lat,
          lng: rl.location.lng,
        }))
      : [];
    const fromSync = event.syncRule
      ? event.syncRule.locations.map((sl) => ({
          id: sl.location.id,
          name: sl.location.name,
          city: sl.location.city,
          lat: sl.location.lat,
          lng: sl.location.lng,
        }))
      : [];
    // Prefer event-specific locations (syncRule) when present, fall back to inherited rule's
    const locations = fromSync.length > 0 ? fromSync : fromRule;

    return {
      id: event.id,
      isMaterialized: false,
      title: event.title,
      type: event.type,
      status: event.status,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      isPointsEligible: event.isPointsEligible,
      basePointsAward: event.basePointsAward,
      description: event.description,
      locationName: event.locationName,
      locationAddress: event.locationAddress,
      locationLat: event.locationLat,
      locationLng: event.locationLng,
      capacity: event.capacity,
      registrationOpenAt: event.registrationOpenAt,
      registrationCloseAt: event.registrationCloseAt,
      recurrenceRuleId: event.recurrenceRuleId,
      overridesOccurrenceAt: event.overridesOccurrenceAt,
      locations,
    };
  }
}
