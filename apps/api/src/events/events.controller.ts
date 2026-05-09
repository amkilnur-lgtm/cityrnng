import {
  Controller,
  DefaultValuePipe,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
import { Public } from "../auth/decorators/public.decorator";
import { EventOccurrenceService } from "./event-occurrence.service";
import { EventsService } from "./events.service";
import { ListEventsQuery } from "./dto/list-events.query";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Controller("events")
@Public()
export class EventsController {
  constructor(
    private readonly events: EventsService,
    private readonly occurrences: EventOccurrenceService,
  ) {}

  /**
   * Materialized list — recurring rule occurrences merged with explicit
   * overrides + standalone special events. Use this for the public
   * /events page and the home "next event" card.
   */
  @Get("upcoming")
  upcoming(
    @Query("weeks", new DefaultValuePipe(8), new ParseIntPipe()) weeks: number,
  ) {
    return this.occurrences.listUpcoming(weeks);
  }

  @Get()
  list(@Query() query: ListEventsQuery) {
    return this.events.listPublic(query);
  }

  /**
   * Detail endpoint accepts two id forms:
   *   - UUID — explicit Event row
   *   - rule:<UUID>:<YYYY-MM-DD> — materialized recurrence occurrence
   * Anything else returns 404.
   */
  @Get(":id")
  getOne(@Param("id") id: string) {
    if (id.startsWith("rule:")) {
      return this.occurrences.getRuleOccurrenceById(id);
    }
    if (UUID_RE.test(id)) {
      return this.events.getByIdOrThrow(id);
    }
    throw new NotFoundException({ code: "EVENT_NOT_FOUND" });
  }
}
