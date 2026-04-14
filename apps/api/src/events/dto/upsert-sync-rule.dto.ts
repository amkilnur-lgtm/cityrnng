import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
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
}
