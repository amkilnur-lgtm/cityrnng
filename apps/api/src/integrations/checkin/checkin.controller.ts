import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from "@nestjs/common";
import { CheckinScanResult } from "@prisma/client";
import { Public } from "../../auth/decorators/public.decorator";
import { CheckinService } from "./checkin.service";
import { ScanDto } from "./dto/scan.dto";

/** Maps an internal scan result to a short status the device can act on. */
const RESULT_MESSAGE: Record<CheckinScanResult, string> = {
  matched: "Отметили — пробежка засчитана",
  duplicate: "Уже отмечен сегодня",
  no_window: "Сейчас нет открытой пробежки на этой точке",
  unknown_code: "Код не распознан",
  error: "Ошибка обработки, попробуйте ещё раз",
};

/**
 * Endpoint a runbase QR scanner (Raspberry Pi) posts scans to. Authenticated
 * by an `X-Device-Key` header, not a user session — hence @Public for the JWT
 * guard, with device auth enforced in the service.
 */
@Controller("integrations/checkin")
@Public()
export class CheckinController {
  private readonly logger = new Logger(CheckinController.name);

  constructor(private readonly checkin: CheckinService) {}

  @Post("scan")
  @HttpCode(HttpStatus.OK)
  async scan(
    @Headers("x-device-key") deviceKey: string | undefined,
    @Body() dto: ScanDto,
  ) {
    const device = await this.checkin.authenticateDevice(deviceKey);
    const outcome = await this.checkin.processScan(device, dto);
    return {
      result: outcome.result,
      // `ok` lets the device beep/flash green only on a real credit (or a
      // benign duplicate), and red/error otherwise.
      ok:
        outcome.result === CheckinScanResult.matched ||
        outcome.result === CheckinScanResult.duplicate,
      idempotent: outcome.idempotent,
      message: RESULT_MESSAGE[outcome.result],
    };
  }
}
