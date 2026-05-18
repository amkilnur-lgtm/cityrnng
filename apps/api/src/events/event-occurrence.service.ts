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
    if (rule.endsAtDate && startsAt > rule.endsAtDate) {
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
    if (override) return mapEventPublic(override);

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

    const [rules, explicits] = await Promise.all([
      this.prisma.eventRecurrenceRule.findMany({
        where: {
          status: RecurrenceRuleStatus.active,
          startsFromDate: { lte: horizon },
          OR: [{ endsAtDate: null }, { endsAtDate: { gte: now } }],
        },
        ...ruleInclude,
      }),
      this.prisma.event.findMany({
        where: {
          status: EventStatus.published,
          startsAt: { gte: now, lte: horizon },
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
      let cursor = this.firstOccurrenceOnOrAfter(rule, now);
      const ruleEnd = rule.endsAtDate && rule.endsAtDate < horizon ? rule.endsAtDate : horizon;
      while (cursor <= ruleEnd) {
        const key = this.overrideKey(rule.id, this.dayOnly(cursor));
        const override = overrides.get(key);
        if (override) {
          out.push(this.toMaterialized(override, rule));
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
