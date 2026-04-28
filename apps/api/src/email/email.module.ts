import { Module, type Provider } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import type { Env } from "../config/env.schema";
import { EmailService } from "./email.service";
import { EMAIL_PROVIDER } from "./email.types";
import { ConsoleEmailProvider } from "./providers/console-provider";
import { SmtpEmailProvider } from "./providers/smtp-provider";

const providerFactory: Provider = {
  provide: EMAIL_PROVIDER,
  inject: [ConfigService, ConsoleEmailProvider, SmtpEmailProvider],
  useFactory: (
    config: ConfigService<Env, true>,
    consoleProvider: ConsoleEmailProvider,
    smtpProvider: SmtpEmailProvider,
  ) => {
    const choice = config.get("EMAIL_PROVIDER", { infer: true });
    return choice === "smtp" ? smtpProvider : consoleProvider;
  },
};

@Module({
  imports: [ConfigModule],
  providers: [
    ConsoleEmailProvider,
    SmtpEmailProvider,
    providerFactory,
    EmailService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
