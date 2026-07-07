import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class SetPasswordDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  currentPassword?: string;

  @IsString()
  @MinLength(8, { message: "Пароль — минимум 8 символов" })
  @MaxLength(128)
  newPassword!: string;
}
