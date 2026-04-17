import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { PointDirection } from "@prisma/client";

export class AdjustPointsDto {
  @IsUUID()
  userId!: string;

  @IsEnum(PointDirection)
  direction!: PointDirection;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  comment!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  idempotencyKey?: string;
}
