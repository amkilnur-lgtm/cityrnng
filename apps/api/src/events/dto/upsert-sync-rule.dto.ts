import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";
import { SyncProvider } from "@prisma/client";

export class UpsertSyncRuleDto {
  @IsOptional()
  @IsEnum(SyncProvider)
  provider?: SyncProvider;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  activityType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minDistanceMeters?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxDistanceMeters?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minDurationSeconds?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxDurationSeconds?: number;

  @IsDateString()
  windowStartsAt!: string;

  @IsDateString()
  windowEndsAt!: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  geofenceLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  geofenceLng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  geofenceRadiusMeters?: number;

  @IsOptional()
  @IsBoolean()
  autoApprove?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(25)
  @ArrayUnique()
  @IsUUID("4", { each: true })
  locationIds?: string[];
}
