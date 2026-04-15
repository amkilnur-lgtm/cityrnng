import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "../../config/env.schema";
import type { StravaActivity, StravaAthlete, StravaTokenResponse } from "./types";

const STRAVA_BASE = "https://www.strava.com/api/v3";
const STRAVA_OAUTH_BASE = "https://www.strava.com";

export interface TokenExchangeParams {
  code: string;
}

export interface TokenRefreshParams {
  refreshToken: string;
}

export interface ListActivitiesParams {
  accessToken: string;
  after?: number;
  before?: number;
  page?: number;
  perPage?: number;
}

@Injectable()
export class StravaApiClient {
  private readonly logger = new Logger(StravaApiClient.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  async exchangeCode({ code }: TokenExchangeParams): Promise<StravaTokenResponse> {
    const body = new URLSearchParams({
      client_id: this.config.get("STRAVA_CLIENT_ID", { infer: true }),
      client_secret: this.config.get("STRAVA_CLIENT_SECRET", { infer: true }),
      code,
      grant_type: "authorization_code",
    });
    return this.postForm<StravaTokenResponse>(`${STRAVA_OAUTH_BASE}/oauth/token`, body);
  }

  async refreshToken({ refreshToken }: TokenRefreshParams): Promise<StravaTokenResponse> {
    const body = new URLSearchParams({
      client_id: this.config.get("STRAVA_CLIENT_ID", { infer: true }),
      client_secret: this.config.get("STRAVA_CLIENT_SECRET", { infer: true }),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });
    return this.postForm<StravaTokenResponse>(`${STRAVA_OAUTH_BASE}/oauth/token`, body);
  }

  async deauthorize(accessToken: string): Promise<void> {
    try {
      const res = await fetch(`${STRAVA_OAUTH_BASE}/oauth/deauthorize`, {
        method: "POST",
        headers: { authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        this.logger.warn(`Strava deauthorize returned ${res.status}`);
      }
    } catch (err) {
      this.logger.warn(`Strava deauthorize failed: ${(err as Error).message}`);
    }
  }

  async getAthlete(accessToken: string): Promise<StravaAthlete> {
    return this.getJson<StravaAthlete>(`${STRAVA_BASE}/athlete`, accessToken);
  }

  async listActivities(params: ListActivitiesParams): Promise<StravaActivity[]> {
    const url = new URL(`${STRAVA_BASE}/athlete/activities`);
    if (params.after) url.searchParams.set("after", String(params.after));
    if (params.before) url.searchParams.set("before", String(params.before));
    if (params.page) url.searchParams.set("page", String(params.page));
    url.searchParams.set("per_page", String(params.perPage ?? 30));
    return this.getJson<StravaActivity[]>(url.toString(), params.accessToken);
  }

  private async postForm<T>(url: string, body: URLSearchParams): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      const detail = await safeText(res);
      this.logger.error(`Strava POST ${url} failed ${res.status}: ${detail}`);
      throw new InternalServerErrorException({ code: "STRAVA_UPSTREAM_ERROR" });
    }
    return (await res.json()) as T;
  }

  private async getJson<T>(url: string, accessToken: string): Promise<T> {
    const res = await fetch(url, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const detail = await safeText(res);
      this.logger.error(`Strava GET ${url} failed ${res.status}: ${detail}`);
      throw new InternalServerErrorException({ code: "STRAVA_UPSTREAM_ERROR" });
    }
    return (await res.json()) as T;
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return "<unreadable body>";
  }
}
