import { IsDateString, IsOptional, IsUUID } from "class-validator";

export class AdminSyncDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsDateString()
  after?: string;

  @IsOptional()
  @IsDateString()
  before?: string;
}
