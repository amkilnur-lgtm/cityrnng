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

export class UpdateRecurrenceRuleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @IsOptional()
  @IsEnum(RecurrenceRuleStatus)
  status?: RecurrenceRuleStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX)
  timeOfDay?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(720)
  durationMinutes?: number;

  @IsOptional()
  @IsBoolean()
  isPointsEligible?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  basePointsAward?: number;

  @IsOptional()
  @IsDateString()
  startsFromDate?: string;

  @IsOptional()
  @IsDateString()
  endsAtDate?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMinSize(1)
  @IsUUID("all", { each: true })
  locationIds?: string[];
}
