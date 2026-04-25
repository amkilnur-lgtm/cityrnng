import { IsOptional, IsString, MaxLength } from "class-validator";

export class RedeemDto {
  /**
   * Optional client-supplied UUID for retry-safety. If a previous redeem with
   * this key already succeeded, the same redemption is returned.
   */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  idempotencyKey?: string;
}
