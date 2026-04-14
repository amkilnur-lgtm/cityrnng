import { IsString, Length } from "class-validator";

export class VerifyLoginDto {
  @IsString()
  @Length(16, 256)
  token!: string;
}
