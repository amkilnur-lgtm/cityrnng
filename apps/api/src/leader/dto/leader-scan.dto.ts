import { IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class LeaderScanDto {
  @IsUUID()
  locationId!: string;

  /** Raw code read off the runner's QR / fob (their static checkin code). */
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  code!: string;
}
