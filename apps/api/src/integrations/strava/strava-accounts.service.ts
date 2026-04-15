import { Injectable, NotFoundException } from "@nestjs/common";
import { SyncProvider, UserProviderAccount } from "@prisma/client";
import { CryptoService } from "../../crypto/crypto.service";
import { PrismaService } from "../../prisma/prisma.service";
import { StravaApiClient } from "./strava-api.client";
import { StravaOAuthService } from "./strava-oauth.service";
import type { StravaTokenResponse } from "./types";

const REFRESH_SKEW_SECONDS = 120;

@Injectable()
export class StravaAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly oauth: StravaOAuthService,
    private readonly api: StravaApiClient,
  ) {}

  async upsertFromTokenResponse(userId: string, tokens: StravaTokenResponse) {
    const providerUserId = tokens.athlete?.id
      ? String(tokens.athlete.id)
      : await this.fetchAthleteId(tokens.access_token);

    const data = {
      provider: SyncProvider.strava,
      providerUserId,
      accessTokenEncrypted: this.crypto.encrypt(tokens.access_token),
      refreshTokenEncrypted: this.crypto.encrypt(tokens.refresh_token),
      tokenExpiresAt: new Date(tokens.expires_at * 1000),
      scope: tokens.scope ?? null,
      disconnectedAt: null,
    };

    return this.prisma.userProviderAccount.upsert({
      where: { userId_provider: { userId, provider: SyncProvider.strava } },
      create: { userId, connectedAt: new Date(), ...data },
      update: { ...data, connectedAt: new Date() },
    });
  }

  findActive(userId: string): Promise<UserProviderAccount | null> {
    return this.prisma.userProviderAccount.findFirst({
      where: { userId, provider: SyncProvider.strava, disconnectedAt: null },
    });
  }

  async disconnect(userId: string): Promise<void> {
    const account = await this.findActive(userId);
    if (!account) return;
    const accessToken = this.safeDecrypt(account.accessTokenEncrypted);
    if (accessToken) {
      await this.api.deauthorize(accessToken);
    }
    await this.prisma.userProviderAccount.update({
      where: { id: account.id },
      data: {
        disconnectedAt: new Date(),
        accessTokenEncrypted: null,
        refreshTokenEncrypted: null,
        tokenExpiresAt: null,
        scope: null,
      },
    });
  }

  async getFreshAccessToken(userId: string): Promise<string> {
    const account = await this.findActive(userId);
    if (!account || !account.accessTokenEncrypted || !account.refreshTokenEncrypted) {
      throw new NotFoundException({ code: "STRAVA_NOT_CONNECTED" });
    }
    const expiresAt = account.tokenExpiresAt?.getTime() ?? 0;
    const now = Date.now();
    if (expiresAt > now + REFRESH_SKEW_SECONDS * 1000) {
      return this.crypto.decrypt(account.accessTokenEncrypted);
    }

    const refreshToken = this.crypto.decrypt(account.refreshTokenEncrypted);
    const tokens = await this.oauth.refreshToken(refreshToken);
    await this.prisma.userProviderAccount.update({
      where: { id: account.id },
      data: {
        accessTokenEncrypted: this.crypto.encrypt(tokens.access_token),
        refreshTokenEncrypted: this.crypto.encrypt(tokens.refresh_token),
        tokenExpiresAt: new Date(tokens.expires_at * 1000),
        scope: tokens.scope ?? account.scope,
      },
    });
    return tokens.access_token;
  }

  private safeDecrypt(payload: string | null): string | null {
    if (!payload) return null;
    try {
      return this.crypto.decrypt(payload);
    } catch {
      return null;
    }
  }

  private async fetchAthleteId(accessToken: string): Promise<string> {
    const athlete = await this.api.getAthlete(accessToken);
    return String(athlete.id);
  }
}
