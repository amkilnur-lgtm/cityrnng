import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { CityLocationStatus } from "@prisma/client";

export class ListLocationsQuery {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsEnum(CityLocationStatus)
  status?: CityLocationStatus;
}
