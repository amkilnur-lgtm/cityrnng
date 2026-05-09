import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, type Transporter } from "nodemailer";
import type { Env } from "../../config/env.schema";
import type { EmailMessage, EmailProvider } from "../email.types";

/**
 * SMTP provider via nodemailer. Reads SMTP_HOST / SMTP_PORT / SMTP_USER /
 * SMTP_PASS / SMTP_SECURE from env. Verifies the connection at boot and
 * logs an error (without crashing) so the API stays up if SMTP is
 * temporarily down — `requestLogin` will then surface a 500, which the
 * frontend already handles.
 */
@Injectable()
export class SmtpEmailProvider implements EmailProvider, OnModuleInit {
  private readonly logger = new Logger(SmtpEmailProvider.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService<Env, true>) {}

  async onModuleInit(): Promise<void> {
    const host = this.config.get("SMTP_HOST", { infer: true });
    const port = this.config.get("SMTP_PORT", { infer: true });
    const secure = this.config.get("SMTP_SECURE", { infer: true });
    const user = this.config.get("SMTP_USER", { infer: true });
    const pass = this.config.get("SMTP_PASS", { infer: true });

    if (!host || !port) {
      this.logger.error(
        "EMAIL_PROVIDER=smtp but SMTP_HOST or SMTP_PORT is missing — emails will fail.",
      );
      return;
    }

    this.transporter = createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });

    try {
      await this.transporter.verify();
      this.logger.log(`SMTP ready · ${host}:${port} secure=${secure}`);
    } catch (err) {
      this.logger.error(
        `SMTP verify failed · ${host}:${port} · ${(err as Error).message}`,
      );
    }
  }

  async send(msg: EmailMessage): Promise<void> {
    if (!this.transporter) {
      throw new Error("SMTP transporter not initialised — check SMTP_* env vars");
    }
    const from = this.config.get("EMAIL_FROM", { infer: true });
    await this.transporter.sendMail({
      from,
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    });
  }

  async verify(): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!this.transporter) {
      return { ok: false, error: "transporter not initialised (SMTP_* env vars missing?)" };
    }
    try {
      await this.transporter.verify();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }
}
