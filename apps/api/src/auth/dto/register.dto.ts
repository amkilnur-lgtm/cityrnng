import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";
import { Transform } from "class-transformer";

export class RegisterDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8, { message: "Пароль — минимум 8 символов" })
  @MaxLength(128)
  password!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(1, { message: "Укажи имя" })
  @MaxLength(80)
  name!: string;
}
