import { Type } from "class-transformer";
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { EventType, RecurrenceRuleStatus } from "@prisma/client";

const TIME_REGEX = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export class CreateRecurrenceRuleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @IsOptional()
  @IsEnum(RecurrenceRuleStatus)
  status?: RecurrenceRuleStatus;

  /** 0 = Sunday, 6 = Saturday */
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsString()
  @Matches(TIME_REGEX, { message: "timeOfDay must be HH:MM (24h)" })
  timeOfDay!: string;

  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(720)
  durationMinutes!: number;

  @IsOptional()
  @IsBoolean()
  isPointsEligible?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  basePointsAward?: number;

  @IsDateString()
  startsFromDate!: string;

  @IsOptional()
  @IsDateString()
  endsAtDate?: string;

  @IsArray()
  @ArrayUnique()
  @ArrayMinSize(1)
  @IsUUID("all", { each: true })
  locationIds!: string[];
}
