import { IsString, Length, MaxLength, MinLength } from "class-validator";

export class ResetPasswordDto {
  @IsString()
  @Length(16, 256)
  token!: string;

  @IsString()
  @MinLength(8, { message: "Пароль — минимум 8 символов" })
  @MaxLength(128)
  newPassword!: string;
}
