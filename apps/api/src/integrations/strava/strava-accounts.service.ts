import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { SyncProvider, UserProviderAccount } from "@prisma/client";
import { CryptoService } from "../../crypto/crypto.service";
import { PrismaService } from "../../prisma/prisma.service";
import { StravaApiClient } from "./strava-api.client";
import { StravaOAuthService } from "./strava-oauth.service";
import type { StravaTokenResponse } from "./types";

const REFRESH_SKEW_SECONDS = 120;

@Injectable()
export class StravaAccountsService {
  // Singleflight per userId: serializes concurrent token refreshes so we
  // don't double-rotate Strava's refresh_token (which would invalidate it
  // and silently lock the user out). In-process only — fine for the
  // single-node API; if we ever scale out, swap for a Redis lock.
  private readonly refreshLocks = new Map<string, Promise<string>>();

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

    // Block silent account-swap: if this user has an ACTIVE Strava link
    // to a different athlete, refuse. The intended flow is disconnect →
    // reconnect (disconnect hard-deletes the row, so reconnect with any
    // athlete works after that). Without this guard, a compromised
    // session could silently rebind to an attacker's Strava account.
    const existing = await this.findActive(userId);
    if (existing && existing.providerUserId !== providerUserId) {
      throw new ConflictException({
        code: "STRAVA_ACCOUNT_MISMATCH",
        message:
          "Этот Strava уже привязан к другому атлету. Сначала отключи текущий, потом подключай заново.",
      });
    }

    const data = {
      provider: SyncProvider.strava,
      providerUserId,
      accessTokenEncrypted: this.crypto.encrypt(tokens.access_token),
      refreshTokenEncrypted: this.crypto.encrypt(tokens.refresh_token),
      tokenExpiresAt: new Date(tokens.expires_at * 1000),
      scope: tokens.scope ?? null,
    };

    return this.prisma.userProviderAccount.upsert({
      where: { userId_provider: { userId, provider: SyncProvider.strava } },
      create: { userId, connectedAt: new Date(), ...data },
      update: { ...data, connectedAt: new Date() },
    });
  }

  findActive(userId: string): Promise<UserProviderAccount | null> {
    return this.prisma.userProviderAccount.findUnique({
      where: { userId_provider: { userId, provider: SyncProvider.strava } },
    });
  }

  /**
   * Disconnect user's Strava account AND purge derived Strava data.
   *
   * Per Strava API Agreement §2.14.vi we must delete user's Strava-derived
   * data on disconnect. Concretely:
   *   - revoke access token (Strava deauthorize)
   *   - hard-delete the UserProviderAccount row
   *   - delete ExternalActivity rows we cached from Strava
   *   - delete EventAttendance rows whose source is the sync provider
   *     (they were derived from Strava activity matching)
   *
   * Hard-delete (not soft) because `(provider, providerUserId)` is a
   * global unique. Leaving a tombstone row blocks any future reconnect
   * of that Strava athlete (whether by the same user with a different
   * athlete, or by another user with the same athlete).
   *
   * Idempotent: if there's no active account, return silently — callers
   * include user-triggered DELETE and the Strava revoke webhook, both of
   * which can race or fire twice.
   *
   * Note: PointTransactions credited from those attendances are not reversed
   * here — they're our derived audit ledger, not Strava data. Reversing
   * those is a separate concern (admin can manually adjust if needed).
   */
  async disconnect(userId: string): Promise<void> {
    const account = await this.findActive(userId);
    if (!account) return;
    const accessToken = this.safeDecrypt(account.accessTokenEncrypted);
    if (accessToken) {
      await this.api.deauthorize(accessToken);
    }
    await this.prisma.$transaction([
      this.prisma.eventAttendance.deleteMany({
        where: {
          userId,
          source: "sync",
          externalActivity: { provider: SyncProvider.strava },
        },
      }),
      this.prisma.externalActivity.deleteMany({
        where: { userId, provider: SyncProvider.strava },
      }),
      this.prisma.userProviderAccount.delete({
        where: { id: account.id },
      }),
    ]);
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

    const inflight = this.refreshLocks.get(userId);
    if (inflight) return inflight;

    const work = this.doRefresh(account.id, userId, account.refreshTokenEncrypted, account.scope);
    this.refreshLocks.set(userId, work);
    try {
      return await work;
    } finally {
      this.refreshLocks.delete(userId);
    }
  }

  private async doRefresh(
    accountId: string,
    userId: string,
    refreshTokenEncrypted: string,
    currentScope: string | null,
  ): Promise<string> {
    const refreshToken = this.crypto.decrypt(refreshTokenEncrypted);
    const tokens = await this.oauth.refreshToken(refreshToken);
    await this.prisma.userProviderAccount.update({
      where: { id: accountId },
      data: {
        accessTokenEncrypted: this.crypto.encrypt(tokens.access_token),
        refreshTokenEncrypted: this.crypto.encrypt(tokens.refresh_token),
        tokenExpiresAt: new Date(tokens.expires_at * 1000),
        scope: tokens.scope ?? currentScope,
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
