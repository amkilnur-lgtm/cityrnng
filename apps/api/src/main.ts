import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import type { Env } from "./config/env.schema";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/v1");
  const config = app.get(ConfigService<Env, true>);
  const port = config.get("API_PORT", { infer: true });
  await app.listen(port);
}

void bootstrap();
