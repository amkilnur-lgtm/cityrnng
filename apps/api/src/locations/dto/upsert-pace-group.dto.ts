import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class UpsertPaceGroupDto {
  /** Distance in km — typically 5 or 10. */
  @IsInt()
  @Min(1)
  @Max(100)
  distanceKm!: number;

  /** Pace as integer seconds per km. 5:30 → 330. */
  @IsInt()
  @Min(120)  // 2:00/km — sub-elite floor
  @Max(900)  // 15:00/km — slow walk ceiling
  paceSecondsPerKm!: number;

  /** Optional pacer name. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  pacerName?: string;
}
