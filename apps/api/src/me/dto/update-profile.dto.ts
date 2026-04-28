import { Transform } from "class-transformer";
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

/**
 * Treat blank strings as null so a user clearing a field actually clears it.
 * `undefined` still means "don't touch this field" — partial PATCH semantics.
 */
const blankAsNull = ({ value }: { value: unknown }) => {
  if (value == null) return value;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

/** displayName is NOT NULL in the DB — trim, never coerce to null. */
const trimOnly = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class UpdateProfileDto {
  @IsOptional()
  @Transform(trimOnly)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @Transform(blankAsNull)
  @IsString()
  @MaxLength(80)
  firstName?: string | null;

  @IsOptional()
  @Transform(blankAsNull)
  @IsString()
  @MaxLength(80)
  lastName?: string | null;

  @IsOptional()
  @Transform(blankAsNull)
  @IsString()
  @MaxLength(80)
  city?: string | null;

  @IsOptional()
  @Transform(blankAsNull)
  @IsString()
  @MaxLength(64)
  telegramHandle?: string | null;

  @IsOptional()
  @Transform(blankAsNull)
  @IsString()
  @MaxLength(64)
  instagramHandle?: string | null;
}
