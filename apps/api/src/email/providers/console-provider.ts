import { Injectable, Logger } from "@nestjs/common";
import type { EmailMessage, EmailProvider } from "../email.types";

/**
 * Dev/no-op provider — logs the email to stdout instead of delivering it.
 * Safe default when no SMTP is configured. The full magic-link URL is
 * printed so the developer can click straight from the terminal.
 */
@Injectable()
export class ConsoleEmailProvider implements EmailProvider {
  private readonly logger = new Logger(ConsoleEmailProvider.name);

  async send(msg: EmailMessage): Promise<void> {
    this.logger.log(
      `[email:console] to=${msg.to} subject="${msg.subject}"\n` +
        `--- text ---\n${msg.text}\n--- end ---`,
    );
  }
}
