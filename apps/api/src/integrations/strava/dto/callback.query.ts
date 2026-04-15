import { IsOptional, IsString, MaxLength } from "class-validator";

export class StravaCallbackQuery {
  @IsOptional()
  @IsString()
  @MaxLength(512)
  code?: string;

  @IsString()
  @MaxLength(2048)
  state!: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  scope?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  error?: string;
}
