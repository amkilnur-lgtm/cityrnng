import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "../config/env.schema";
import { EMAIL_PROVIDER, type EmailProvider } from "./email.types";
import { buildMagicLinkEmail } from "./templates/magic-link";

/**
 * High-level façade over the active EmailProvider. Centralises template
 * rendering + URL building so callers don't need to know about transports.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @Inject(EMAIL_PROVIDER) private readonly provider: EmailProvider,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async sendMagicLink(opts: {
    email: string;
    token: string;
    ttlMinutes: number;
  }): Promise<void> {
    const baseUrl = this.config.get("WEB_BASE_URL", { infer: true });
    const url = `${baseUrl.replace(/\/$/, "")}/auth/verify?token=${encodeURIComponent(
      opts.token,
    )}`;
    const message = buildMagicLinkEmail({
      to: opts.email,
      url,
      ttlMinutes: opts.ttlMinutes,
    });
    try {
      await this.provider.send(message);
    } catch (err) {
      this.logger.error(
        `Failed to send magic-link to ${opts.email}: ${(err as Error).message}`,
      );
      throw err;
    }
  }
}
