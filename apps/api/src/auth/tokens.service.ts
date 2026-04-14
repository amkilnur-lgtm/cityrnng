import { createHash, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Env } from "../config/env.schema";
import type { AccessTokenPayload } from "./types";

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenHash: string;
  refreshTokenExpiresAt: Date;
}

@Injectable()
export class TokensService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async issue(user: { id: string; email: string; roles: string[] }): Promise<IssuedTokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, roles: user.roles } satisfies AccessTokenPayload,
      {
        secret: this.config.get("JWT_ACCESS_SECRET", { infer: true }),
        expiresIn: this.config.get("ACCESS_TOKEN_TTL", { infer: true }),
      },
    );

    const refreshToken = randomBytes(48).toString("base64url");
    const refreshTokenHash = hashRefresh(refreshToken);
    const ttlDays = this.config.get("REFRESH_TOKEN_TTL_DAYS", { infer: true });
    const refreshTokenExpiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    return { accessToken, refreshToken, refreshTokenHash, refreshTokenExpiresAt };
  }
}

export function hashRefresh(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
