import { IsDateString, IsEnum, IsOptional } from "class-validator";
import { EventStatus, EventType } from "@prisma/client";

export class ListEventsQuery {
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
