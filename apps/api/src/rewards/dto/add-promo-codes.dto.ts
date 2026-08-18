import { IsString, MaxLength, MinLength } from "class-validator";

export class AddPromoCodesDto {
  /** Pasted blob of partner promo codes — one per line (or comma/semicolon). */
  @IsString()
  @MinLength(1)
  @MaxLength(100_000)
  text!: string;
}
