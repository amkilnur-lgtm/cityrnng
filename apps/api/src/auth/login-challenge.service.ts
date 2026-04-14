import { randomBytes, createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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

  async issue(email: string): Promise<IssuedChallenge> {
    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const ttlMinutes = this.config.get("LOGIN_CHALLENGE_TTL_MINUTES", { infer: true });
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

    await this.prisma.loginChallenge.create({
      data: { email, tokenHash, expiresAt },
    });

    return { token, expiresAt };
  }

  async consume(token: string): Promise<{ email: string } | null> {
    const tokenHash = hashToken(token);
    const challenge = await this.prisma.loginChallenge.findUnique({ where: { tokenHash } });
    if (!challenge) return null;
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
