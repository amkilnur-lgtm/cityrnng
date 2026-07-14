import { ScanDeviceStatus } from "@prisma/client";
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateScanDeviceDto {
  @IsUUID()
  locationId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  label!: string;
}

export class UpdateScanDeviceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  label?: string;

  @IsOptional()
  @IsEnum(ScanDeviceStatus)
  status?: ScanDeviceStatus;
}

export class ListScansQuery {
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;
}

/** Admin-triggered scan for testing a device before/without real hardware. */
export class TestScanDto {
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  checkinCode!: string;
}
