import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { ROLE_ADMIN, type AuthenticatedUser } from "../../auth/types";
import { AdminCheckinService } from "./admin-checkin.service";
import {
  CreateScanDeviceDto,
  ListScansQuery,
  TestScanDto,
  UpdateScanDeviceDto,
} from "./dto/admin-device.dto";

@Controller("admin/scan-devices")
@UseGuards(RolesGuard)
@Roles(ROLE_ADMIN)
export class AdminCheckinController {
  constructor(private readonly admin: AdminCheckinService) {}

  @Get()
  listDevices() {
    return this.admin.listDevices();
  }

  @Post()
  createDevice(
    @Body() dto: CreateScanDeviceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.admin.createDevice({
      locationId: dto.locationId,
      label: dto.label,
      createdById: user.id,
    });
  }

  @Patch(":id")
  updateDevice(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateScanDeviceDto,
  ) {
    return this.admin.updateDevice(id, dto);
  }

  @Post(":id/rotate-key")
  @HttpCode(HttpStatus.OK)
  rotateKey(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.admin.rotateKey(id);
  }

  @Post(":id/test-scan")
  @HttpCode(HttpStatus.OK)
  testScan(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: TestScanDto,
  ) {
    return this.admin.testScan(id, dto.checkinCode);
  }

  @Get("scans")
  listScans(@Query() query: ListScansQuery) {
    return this.admin.listScans({
      deviceId: query.deviceId,
      locationId: query.locationId,
    });
  }
}
