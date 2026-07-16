import { randomBytes, createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LoginChallengePurpose } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { Env } from "../config/env.schema";

export interface IssuedChallenge {
  token: string;
  expiresAt: Date;
}

@Injectable()
export class LoginChallengeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async issue(
    email: string,
    purpose: LoginChallengePurpose = LoginChallengePurpose.login,
  ): Promise<IssuedChallenge> {
    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const ttlMinutes = this.config.get("LOGIN_CHALLENGE_TTL_MINUTES", { infer: true });
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

    await this.prisma.loginChallenge.create({
      data: { email, tokenHash, expiresAt, purpose },
    });

    return { token, expiresAt };
  }

  /**
   * Atomically spend a one-time token. The `purpose` must match what it was
   * issued for — a login token can't reset a password and vice-versa. Returns
   * null for unknown / already-consumed / expired / wrong-purpose tokens
   * (no distinction, so callers never leak which case tripped).
   */
  async consume(
    token: string,
    purpose: LoginChallengePurpose = LoginChallengePurpose.login,
  ): Promise<{ email: string } | null> {
    const tokenHash = hashToken(token);
    const challenge = await this.prisma.loginChallenge.findUnique({ where: { tokenHash } });
    if (!challenge) return null;
    if (challenge.purpose !== purpose) return null;
    if (challenge.consumedAt) return null;
    if (challenge.expiresAt.getTime() <= Date.now()) return null;

    const updated = await this.prisma.loginChallenge.updateMany({
      where: { id: challenge.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    if (updated.count === 0) return null;

    return { email: challenge.email };
  }
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
