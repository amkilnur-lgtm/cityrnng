import type { EmailMessage } from "../email.types";

export interface PasswordResetPayload {
  to: string;
  url: string;
  /** Lifetime of the link in minutes — surfaced in copy. */
  ttlMinutes: number;
}

export function buildPasswordResetEmail(
  payload: PasswordResetPayload,
): EmailMessage {
  const { to, url, ttlMinutes } = payload;

  const text = [
    "Привет!",
    "",
    `Ты запросил сброс пароля в CITYRNNG. Открой эту ссылку и задай новый пароль (действует ${ttlMinutes} минут):`,
    "",
    url,
    "",
    "Если ты не запрашивал сброс — просто проигнорируй это письмо, пароль не изменится.",
    "",
    "— Ситираннинг, Уфа",
  ].join("\n");

  const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>Сброс пароля в CITYRNNG</title>
</head>
<body style="margin:0;padding:0;background:#F4F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1A1A1A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" style="max-width:520px;border-collapse:collapse;background:#FAF7F0;border:1px solid #1A1A1A;">
          <tr>
            <td style="padding:32px 32px 16px 32px;">
              <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#1A1A1A;">
                city<span style="color:#E63025;">rnng</span>
              </div>
              <div style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.14em;color:#737373;margin-top:4px;">
                Уфа · сброс пароля
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 16px 32px;">
              <h1 style="font-family:Georgia,serif;font-size:28px;line-height:1.15;font-weight:700;letter-spacing:-0.02em;color:#1A1A1A;margin:8px 0 12px 0;">
                Задай <em style="color:#E63025;font-style:normal;">новый пароль</em>.
              </h1>
              <p style="font-size:15px;line-height:1.55;color:#404040;margin:0 0 24px 0;">
                Ссылка действует ${ttlMinutes}&nbsp;минут. Если ты не запрашивал сброс — просто проигнорируй письмо, пароль не изменится.
              </p>
              <a href="${url}" style="display:inline-block;background:#E63025;color:#FAF7F0;text-decoration:none;padding:14px 24px;font-size:14px;font-weight:600;border:1px solid #E63025;">
                Задать новый пароль →
              </a>
              <p style="font-size:12px;line-height:1.55;color:#737373;margin:24px 0 0 0;word-break:break-all;">
                Если кнопка не работает, скопируй ссылку:<br />
                <span style="font-family:'SF Mono',Menlo,Consolas,monospace;color:#1A1A1A;">${url}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #E6E0D0;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.14em;color:#737373;">
              ситираннинг · уфа
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    to,
    subject: "Сброс пароля в CITYRNNG",
    text,
    html,
  };
}
