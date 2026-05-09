// Sentry must be initialised before any other import so the SDK can
// patch Node internals before downstream modules grab their handles.
import "./instrument";
import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";
import type { Env } from "./config/env.schema";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  // Caddy terminates TLS on the same host and forwards to Nest. Honor
  // X-Forwarded-For from loopback only so ThrottlerGuard sees the real
  // client IP instead of bucketing every request under 127.0.0.1.
  app.set("trust proxy", "loopback");
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const config = app.get(ConfigService<Env, true>);
  const port = config.get("API_PORT", { infer: true });
  await app.listen(port);
}

void bootstrap();
