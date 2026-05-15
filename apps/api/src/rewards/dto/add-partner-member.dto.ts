import { IsEmail } from "class-validator";

export class AddPartnerMemberDto {
  @IsEmail()
  email!: string;
}
