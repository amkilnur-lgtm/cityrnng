import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService, rolesOf } from "../users/users.service";
import { LoginChallengeService } from "./login-challenge.service";
import { TokensService } from "./tokens.service";
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
    private readonly config: ConfigService<Env, true>,
  ) {}

  async requestLogin(email: string): Promise<RequestLoginResult> {
    const { token, expiresAt } = await this.challenges.issue(email);
    this.logger.log(`Login challenge issued for ${email}: ${token} (expires ${expiresAt.toISOString()})`);
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
}
