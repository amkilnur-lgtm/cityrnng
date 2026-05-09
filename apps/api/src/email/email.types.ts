export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface EmailProvider {
  send(msg: EmailMessage): Promise<void>;
  /** Returns ok=true if the channel is reachable (SMTP verify, etc). */
  verify(): Promise<{ ok: true } | { ok: false; error: string }>;
}

export const EMAIL_PROVIDER = Symbol("EMAIL_PROVIDER");
