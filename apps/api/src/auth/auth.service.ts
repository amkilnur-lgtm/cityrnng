import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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
