import { resolve } from "node:path";
import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { SentryGlobalFilter, SentryModule } from "@sentry/nestjs/setup";
import { LoggerModule } from "nestjs-pino";
import { randomUUID } from "node:crypto";
import { validateEnv } from "./config/env.validation";
import type { Env } from "./config/env.schema";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { MeModule } from "./me/me.module";
import { EventsModule } from "./events/events.module";
import { AttendancesModule } from "./attendances/attendances.module";
import { CryptoModule } from "./crypto/crypto.module";
import { StravaModule } from "./integrations/strava/strava.module";
import { LocationsModule } from "./locations/locations.module";
import { PointsModule } from "./points/points.module";
import { RewardsModule } from "./rewards/rewards.module";
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
    ThrottlerModule.forRoot([
      { name: "default", ttl: 60_000, limit: 100 },
    ]),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const isProd = config.get("NODE_ENV", { infer: true }) === "production";
        const level = config.get("LOG_LEVEL", { infer: true });
        return {
          pinoHttp: {
            level,
            // Pretty in dev, JSON in prod (one log line per request, parseable).
            transport: isProd
              ? undefined
              : {
                  target: "pino-pretty",
                  options: { singleLine: true, colorize: true, translateTime: "SYS:HH:MM:ss" },
                },
            // Stable request id for correlating across logs and Sentry events.
            genReqId: (req, res) => {
              const existing = req.headers["x-request-id"];
              const id =
                typeof existing === "string" && existing.length > 0
                  ? existing
                  : randomUUID();
              res.setHeader("x-request-id", id);
              return id;
            },
            // Don't log the auth header or cookies, ever.
            redact: {
              paths: [
                "req.headers.authorization",
                "req.headers.cookie",
                'req.headers["x-forwarded-for"]',
              ],
              censor: "[redacted]",
            },
            customLogLevel: (_req, res, err) => {
              if (err || res.statusCode >= 500) return "error";
              if (res.statusCode >= 400) return "warn";
              return "info";
            },
          },
        };
      },
    }),
    SentryModule.forRoot(),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    MeModule,
    EventsModule,
    AttendancesModule,
    CryptoModule,
    StravaModule,
    LocationsModule,
    PointsModule,
    RewardsModule,
  ],
  providers: [
    // SentryGlobalFilter must be first so it sees errors before any
    // other filter swallows them. Subsequent filters still run.
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
