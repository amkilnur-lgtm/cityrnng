# GitHub Secrets Checklist

Реестр секретов для CITYRNNG. Имена в этом списке = имена секретов в GitHub Environments. Список синхронизирован с `apps/api/src/config/env.schema.ts` и `apps/web` env-нуждами на 2026-04-25. Когда добавляешь переменную в API/Web — добавь её сюда же.

## 1. Claude / AI

- `ANTHROPIC_API_KEY` — для Claude GitHub integration / workflow automation

## 2. Container registry

- `REGISTRY_URL` — адрес registry (Я.Облако: `cr.yandex/<registry-id>`)
- `REGISTRY_USERNAME`
- `REGISTRY_PASSWORD`
- `IMAGE_NAME` — имя image, напр. `cityrnng/app`

## 3. Deploy access

Для каждого окружения (`staging`, `production`):

- `<ENV>_HOST` — IP или домен сервера
- `<ENV>_USER` — SSH user
- `<ENV>_SSH_KEY` — приватный SSH key
- `<ENV>_APP_DIR` — директория приложения, напр. `/opt/cityrnng`

## 4. API env (apps/api/.env) — обязательные

Соответствуют `envSchema` (см. `apps/api/src/config/env.schema.ts`). Хранить в GitHub Environment secrets:

| Secret | Тип | Default | Назначение |
|---|---|---|---|
| `NODE_ENV` | string | `development` | `production` для прода |
| `API_PORT` | int | `4000` | порт API HTTP |
| `DATABASE_URL` | string | — | Postgres connection (с sslmode для прода) |
| `JWT_ACCESS_SECRET` | string ≥ 16 | — | подпись access JWT |
| `JWT_REFRESH_SECRET` | string ≥ 16 | — | подпись refresh JWT (отличается от access!) |
| `ACCESS_TOKEN_TTL` | string | `15m` | jsonwebtoken-формат |
| `REFRESH_TOKEN_TTL_DAYS` | int | `30` | срок жизни refresh |
| `LOGIN_CHALLENGE_TTL_MINUTES` | int | `15` | срок жизни magic-link токена |
| `AUTH_DEV_RETURN_TOKEN` | bool | `false` | **обязательно `false` на проде** — иначе токен возвращается в HTTP-ответе |
| `TOKEN_ENCRYPTION_KEY` | base64-32B | — | шифрование Strava-токенов в БД (32 байта в base64) |
| `STRAVA_CLIENT_ID` | string | — | из Strava Dev Portal |
| `STRAVA_CLIENT_SECRET` | string | — | из Strava Dev Portal |
| `STRAVA_REDIRECT_URI` | url | — | **должно указывать на Next.js wrapper:** `https://<frontend>/integrations/strava/callback` |
| `STRAVA_SCOPES` | string | `read,activity:read` | через запятую |
| `WELCOME_BONUS_POINTS` | int | `100` | приветственный бонус (мы ставим 50) |
| `EVENT_ATTENDANCE_REGULAR_POINTS_FALLBACK` | int | `0` | если у `Event` нет `basePointsAward` |
| `EVENT_ATTENDANCE_SPECIAL_POINTS_FALLBACK` | int | `0` | то же для type=special |

**Опциональное (текущий код не использует):**

- `SEED_ADMIN_EMAIL` — при `pnpm prisma db seed` повышает существующего юзера до `admin` (юзер должен быть уже зарегистрирован через magic-link)

## 5. Web env (apps/web)

Только публичные `NEXT_PUBLIC_*`, остальное — server-side через server components/route handlers.

| Secret | Default | Назначение |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1` | базовый URL API. На проде: `https://api.cityrnng.ru/api/v1` |
| `NODE_ENV` | `development` | `production` отключает Dev-toggle |
| `TZ` | system | поставить `Asia/Yekaterinburg` для корректной материализации `event_recurrence_rules` |

## 6. Email / magic-link канал — НЕ РЕАЛИЗОВАНО

> ⚠️ **Critical gap:** код отправки писем в `apps/api` отсутствует. `POST /auth/request-login` создаёт challenge, но не шлёт письмо. На проде нужен email-провайдер + интеграция (см. DEPLOY-RUNBOOK §gap).
> Когда выберем провайдер — добавить сюда:
> - `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` (если SMTP)
> - или `MAILGUN_API_KEY` / `MAILGUN_DOMAIN` / `MAILGUN_FROM`
> - или `SENDPULSE_API_USER_ID` / `SENDPULSE_API_SECRET`
> - или Я.Постбокс / Я.Cloud Functions

## 7. Database

- `DATABASE_URL` — Postgres `postgres://user:pass@host:port/cityrnng?sslmode=require`
- `DIRECT_DATABASE_URL` — если используется connection pooler (PgBouncer), отдельная прямая строка для prisma migrate

## 8. Redis (зарезервировано)

- `REDIS_URL` — `redis://host:6379`. **Сейчас не используется в коде**, но контейнер в docker-compose есть. Заведи когда появится BullMQ / sessions.

## 9. Object storage (Я.Облако Object Storage S3-совместимый)

Для backup-файлов и пользовательских аватарок:

- `S3_ENDPOINT` — `https://storage.yandexcloud.net`
- `S3_REGION` — `ru-central1`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`

## 10. Monitoring / analytics

- `SENTRY_DSN` — error tracking (api + web)
- `POSTHOG_KEY` — продуктовая аналитика
- `YANDEX_METRICA_ID` — счётчик Я.Метрики

## 11. Рекомендации по хранению

- Используйте GitHub Environments: `staging` и `production`
- Production secret values должны жить только в `production` environment
- Не храните `.env` в репозитории
- Staging и production ключи **обязательно** разные (особенно `JWT_*` и `TOKEN_ENCRYPTION_KEY`)
- SSH-ключ для deploy с минимальными правами (только `sudo systemctl restart`)
- `TOKEN_ENCRYPTION_KEY` сгенерировать: `openssl rand -base64 32`
- `JWT_*_SECRET` сгенерировать: `openssl rand -hex 32`
