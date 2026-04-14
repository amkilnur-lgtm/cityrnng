import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";
import { Public } from "../auth/decorators/public.decorator";
import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
@Public()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  check() {
    return { status: "ok" };
  }

  @Get("db")
  async checkDb() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok", db: "ok" };
    } catch {
      throw new HttpException(
        { status: "error", db: "down" },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
