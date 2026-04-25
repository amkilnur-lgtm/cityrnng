import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, ParseUUIDPipe, Query } from "@nestjs/common";
import { Public } from "../auth/decorators/public.decorator";
import { EventOccurrenceService } from "./event-occurrence.service";
import { EventsService } from "./events.service";
import { ListEventsQuery } from "./dto/list-events.query";

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

  @Get(":id")
  getOne(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.events.getByIdOrThrow(id);
  }
}
