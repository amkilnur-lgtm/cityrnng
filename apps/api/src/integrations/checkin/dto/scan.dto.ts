import { IsISO8601, IsString, MaxLength, MinLength } from "class-validator";

/**
 * Payload a runbase scanner POSTs for a single QR scan. The device
 * authenticates separately via the `X-Device-Key` header.
 */
export class ScanDto {
  /** Raw string read off the runner's QR / fob (their static checkin code). */
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  code!: string;

  /**
   * Device-generated id, unique per device. Makes re-sends from the offline
   * buffer idempotent — the same scanId never double-credits.
   */
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  scanId!: string;

  /** When the device physically scanned (may predate delivery if buffered). */
  @IsISO8601()
  scannedAt!: string;
}
