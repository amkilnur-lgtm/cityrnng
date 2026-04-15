import { randomBytes } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { SyncProvider } from "@prisma/client";
import type { Env } from "../../config/env.schema";
import { StravaApiClient } from "./strava-api.client";
import type { StateClaims, StravaTokenResponse } from "./types";

const STATE_TTL = "10m";

@Injectable()
export class StravaOAuthService {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly jwt: JwtService,
    private readonly api: StravaApiClient,
  ) {}

  async buildAuthorizeUrl(userId: string): Promise<string> {
    const state = await this.jwt.signAsync(
      { sub: userId, kind: "strava_oauth", nonce: randomBytes(16).toString("hex") } satisfies StateClaims,
      {
        secret: this.stateSecret(),
        expiresIn: STATE_TTL,
      },
    );
    const url = new URL("https://www.strava.com/oauth/authorize");
    url.searchParams.set("client_id", this.config.get("STRAVA_CLIENT_ID", { infer: true }));
    url.searchParams.set("redirect_uri", this.config.get("STRAVA_REDIRECT_URI", { infer: true }));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("approval_prompt", "auto");
    url.searchParams.set("scope", this.config.get("STRAVA_SCOPES", { infer: true }));
    url.searchParams.set("state", state);
    return url.toString();
  }

  async verifyState(state: string): Promise<string> {
    try {
      const claims = await this.jwt.verifyAsync<StateClaims>(state, { secret: this.stateSecret() });
      if (claims.kind !== "strava_oauth") {
        throw new UnauthorizedException({ code: "STRAVA_STATE_INVALID" });
      }
      return claims.sub;
    } catch {
      throw new UnauthorizedException({ code: "STRAVA_STATE_INVALID" });
    }
  }

  exchangeCode(code: string): Promise<StravaTokenResponse> {
    return this.api.exchangeCode({ code });
  }

  refreshToken(refreshToken: string): Promise<StravaTokenResponse> {
    return this.api.refreshToken({ refreshToken });
  }

  get provider(): SyncProvider {
    return SyncProvider.strava;
  }

  private stateSecret(): string {
    // Reuse access-token secret so we don't introduce another secret; state tokens are ephemeral.
    return this.config.get("JWT_ACCESS_SECRET", { infer: true });
  }
}
