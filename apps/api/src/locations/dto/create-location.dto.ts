import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { CityLocationStatus } from "@prisma/client";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateLocationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @IsString()
  @Matches(SLUG_REGEX, { message: "slug must be lowercase, hyphen-separated" })
  @MaxLength(200)
  slug!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  venue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @Type(() => Number)
  @IsLatitude()
  lat!: number;

  @Type(() => Number)
  @IsLongitude()
  lng!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  radiusMeters?: number;

  @IsOptional()
  @IsEnum(CityLocationStatus)
  status?: CityLocationStatus;
}
