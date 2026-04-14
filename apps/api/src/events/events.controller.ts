import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { Public } from "../auth/decorators/public.decorator";
import { EventsService } from "./events.service";
import { ListEventsQuery } from "./dto/list-events.query";

@Controller("events")
@Public()
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list(@Query() query: ListEventsQuery) {
    return this.events.listPublic(query);
  }

  @Get(":id")
  getOne(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.events.getByIdOrThrow(id);
  }
}
