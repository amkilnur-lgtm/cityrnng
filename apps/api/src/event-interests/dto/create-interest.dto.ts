import { IsUUID } from "class-validator";

export class CreateInterestDto {
  @IsUUID()
  locationId!: string;
}
