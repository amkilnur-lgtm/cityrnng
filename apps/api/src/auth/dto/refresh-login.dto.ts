import { IsString, MinLength } from "class-validator";

export class RefreshLoginDto {
  @IsString()
  @MinLength(20)
  refreshToken!: string;
}
