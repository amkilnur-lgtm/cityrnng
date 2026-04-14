import { resolve } from "node:path";
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "./config/env.validation";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { MeModule } from "./me/me.module";
import { EventsModule } from "./events/events.module";
import { AttendancesModule } from "./attendances/attendances.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";

// Load .env from the monorepo root regardless of cwd. In production, env vars
// come from the host/container — ConfigModule simply skips missing files.
// __dirname at runtime is apps/api/dist → repo root is three levels up.
const monorepoRootEnv = resolve(__dirname, "..", "..", "..", ".env");

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [monorepoRootEnv],
      validate: validateEnv,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    MeModule,
    EventsModule,
    AttendancesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
