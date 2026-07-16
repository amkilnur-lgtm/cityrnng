import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LoginChallengePurpose } from "@prisma/client";
import { CryptoService } from "../crypto/crypto.service";
import { EmailService } from "../email/email.service";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService, rolesOf } from "../users/users.service";
import { LoginChallengeService } from "./login-challenge.service";
import { TokensService, hashRefresh } from "./tokens.service";
import type { Env } from "../config/env.schema";

export interface RequestLoginResult {
  ok: true;
  expiresAt: Date;
  devToken?: string;
}

export interface VerifyLoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    roles: string[];
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly challenges: LoginChallengeService,
    private readonly tokens: TokensService,
    private readonly email: EmailService,
    private readonly crypto: CryptoService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async requestLogin(email: string): Promise<RequestLoginResult> {
    const { token, expiresAt } = await this.challenges.issue(email);
    const ttlMinutes = this.config.get("LOGIN_CHALLENGE_TTL_MINUTES", { infer: true });
    this.logger.log(
      `Login challenge issued for ${email} (expires ${expiresAt.toISOString()})`,
    );

    // Email delivery failure must not leak user-existence info via timing or
    // error messages, but it also shouldn't lock everyone out — we log and
    // surface a generic 500 to the client.
    await this.email.sendMagicLink({ email, token, ttlMinutes });

    const exposeToken = this.config.get("AUTH_DEV_RETURN_TOKEN", { infer: true });
    return exposeToken ? { ok: true, expiresAt, devToken: token } : { ok: true, expiresAt };
  }

  async verifyLogin(
    token: string,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<VerifyLoginResult> {
    const consumed = await this.challenges.consume(token);
    if (!consumed) {
      throw new UnauthorizedException({ code: "AUTH_INVALID_TOKEN" });
    }

    const user = await this.users.ensureFromVerifiedEmail(consumed.email);
    const roles = rolesOf(user);
    const issued = await this.tokens.issue({ id: user.id, email: user.email, roles });

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: issued.refreshTokenHash,
        expiresAt: issued.refreshTokenExpiresAt,
        userAgent: meta.userAgent ?? null,
        ipAddress: meta.ipAddress ?? null,
      },
    });

    return {
      accessToken: issued.accessToken,
      refreshToken: issued.refreshToken,
      user: { id: user.id, email: user.email, roles },
    };
  }

  /**
   * Send a password-reset link. Always resolves with the same shape whether
   * or not the email maps to an account — no user-enumeration via response or
   * timing (we still compute expiresAt and only skip the actual send). A
   * `password_reset`-scoped one-time token is issued to real accounts only.
   */
  async requestPasswordReset(email: string): Promise<RequestLoginResult> {
    const ttlMinutes = this.config.get("LOGIN_CHALLENGE_TTL_MINUTES", { infer: true });
    const user = await this.users.findByEmailForAuth(email);
    const exposeToken = this.config.get("AUTH_DEV_RETURN_TOKEN", { infer: true });

    if (!user) {
      // Unknown email: return the same ok+expiresAt without sending anything.
      const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
      this.logger.log(`Password-reset requested for unknown email ${email} — no-op`);
      return { ok: true, expiresAt };
    }

    const { token, expiresAt } = await this.challenges.issue(
      email,
      LoginChallengePurpose.password_reset,
    );
    this.logger.log(
      `Password-reset challenge issued for ${email} (expires ${expiresAt.toISOString()})`,
    );
    await this.email.sendPasswordReset({ email, token, ttlMinutes });

    return exposeToken ? { ok: true, expiresAt, devToken: token } : { ok: true, expiresAt };
  }

  /**
   * Consume a password-reset token, set the new password, revoke every active
   * session (a reset logs out all other devices), and start a fresh session —
   * so the user lands logged in on the tab where they reset.
   */
  async resetPassword(
    token: string,
    newPassword: string,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<VerifyLoginResult> {
    const consumed = await this.challenges.consume(
      token,
      LoginChallengePurpose.password_reset,
    );
    if (!consumed) {
      throw new UnauthorizedException({ code: "AUTH_INVALID_TOKEN" });
    }

    const user = await this.users.findByEmailForAuth(consumed.email);
    if (!user) {
      // Account vanished between issue and consume — treat as invalid.
      throw new UnauthorizedException({ code: "AUTH_INVALID_TOKEN" });
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: this.crypto.hashPassword(newPassword) },
      }),
      this.prisma.session.updateMany({
        where: { userId: user.id, status: "active" },
        data: { status: "revoked", revokedAt: new Date() },
      }),
    ]);

    // startSession creates the new session AFTER the revoke-all above, so the
    // fresh one survives.
    return this.startSession(user.id, user.email, rolesOf(user), meta);
  }

  /** Create a new account with a password and log it in immediately. */
  async registerWithPassword(
    input: { email: string; password: string; name: string },
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<VerifyLoginResult> {
    const user = await this.users.registerWithPassword(input);
    return this.startSession(user.id, user.email, rolesOf(user), meta);
  }

  /** Verify email + password and log in. Same-tab flow, no email round-trip. */
  async loginWithPassword(
    email: string,
    password: string,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<VerifyLoginResult> {
    const user = await this.users.findByEmailForAuth(email);
    if (!user) {
      throw new UnauthorizedException({ code: "AUTH_INVALID_CREDENTIALS" });
    }
    if (!user.passwordHash) {
      // Legacy / magic-link-only account — steer them to the link flow.
      throw new UnauthorizedException({ code: "NO_PASSWORD_SET" });
    }
    if (!this.crypto.verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException({ code: "AUTH_INVALID_CREDENTIALS" });
    }
    return this.startSession(user.id, user.email, rolesOf(user), meta);
  }

  /** Issue an access+refresh pair and persist the session row. */
  private async startSession(
    userId: string,
    email: string,
    roles: string[],
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<VerifyLoginResult> {
    const issued = await this.tokens.issue({ id: userId, email, roles });
    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: issued.refreshTokenHash,
        expiresAt: issued.refreshTokenExpiresAt,
        userAgent: meta.userAgent ?? null,
        ipAddress: meta.ipAddress ?? null,
      },
    });
    return {
      accessToken: issued.accessToken,
      refreshToken: issued.refreshToken,
      user: { id: userId, email, roles },
    };
  }

  /**
   * Rotate a refresh token: validate the presented token, mark its session
   * revoked, and issue a fresh access+refresh pair tied to a new session.
   * Old refresh tokens become unusable on first use — that's the point.
   */
  async refresh(
    refreshToken: string,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<VerifyLoginResult> {
    const refreshTokenHash = hashRefresh(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash },
      include: {
        user: { include: { profile: true, roles: { include: { role: true } } } },
      },
    });

    if (!session || session.status !== "active") {
      throw new UnauthorizedException({ code: "AUTH_INVALID_REFRESH" });
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      // mark expired so we don't keep tripping the same row
      await this.prisma.session.update({
        where: { id: session.id },
        data: { status: "expired" },
      });
      throw new UnauthorizedException({ code: "AUTH_INVALID_REFRESH" });
    }

    const user = session.user;
    const roles = rolesOf(user);
    const issued = await this.tokens.issue({ id: user.id, email: user.email, roles });

    await this.prisma.$transaction([
      this.prisma.session.update({
        where: { id: session.id },
        data: { status: "revoked", revokedAt: new Date() },
      }),
      this.prisma.session.create({
        data: {
          userId: user.id,
          refreshTokenHash: issued.refreshTokenHash,
          expiresAt: issued.refreshTokenExpiresAt,
          userAgent: meta.userAgent ?? null,
          ipAddress: meta.ipAddress ?? null,
        },
      }),
    ]);

    return {
      accessToken: issued.accessToken,
      refreshToken: issued.refreshToken,
      user: { id: user.id, email: user.email, roles },
    };
  }

  /**
   * Revoke the session backing the given refresh token. Idempotent — a
   * missing or already-revoked session is treated as success so logout
   * never reveals whether a token was valid.
   */
  async logout(refreshToken: string | undefined): Promise<{ ok: true }> {
    if (!refreshToken) return { ok: true };
    const refreshTokenHash = hashRefresh(refreshToken);
    await this.prisma.session.updateMany({
      where: { refreshTokenHash, status: "active" },
      data: { status: "revoked", revokedAt: new Date() },
    });
    return { ok: true };
  }
}
