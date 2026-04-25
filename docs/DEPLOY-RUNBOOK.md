# Deploy Runbook — CITYRNNG

Пошаговый гайд по подъёму staging/production окружения. Цель: первый рабочий staging за 1-2 часа после получения VM. Production — после прогона staging хотя бы неделю.

> **Status (2026-04-25):** инструкция написана под текущий код. Известный critical gap — нет реализации email-канала для magic-link. См. §10.

## Содержание

1. [Пререквизиты](#1-пререквизиты)
2. [Подготовка VM (Я.Облако)](#2-подготовка-vm)
3. [Postgres + Redis](#3-postgres--redis)
4. [Strava Dev Portal](#4-strava-dev-portal)
5. [Сборка образов](#5-сборка-образов)
6. [Env переменные](#6-env-переменные)
7. [Миграции БД](#7-миграции-бд)
8. [Seed: роли + локации + recurrence rule](#8-seed-роли--локации--recurrence-rule)
9. [Запуск сервисов + reverse proxy](#9-запуск-сервисов--reverse-proxy)
10. [Critical gap: email канал](#10-critical-gap-email-канал)
11. [Health checks](#11-health-checks)
12. [Backup](#12-backup)
13. [Логирование и observability](#13-логирование-и-observability)
14. [Откат / hotfix](#14-откат--hotfix)

---

## 1. Пререквизиты

- Account в Я.Облако с правами на создание VM, Object Storage, DNS
- Домен `cityrnng.ru` (или поддомен `staging.cityrnng.ru`) с делегированием DNS на Я.DNS или внешнего регистратора
- Strava Developer account
- Container Registry (Я.CR или Docker Hub)
- GitHub Environment `staging` (и потом `production`) с заведёнными секретами по `docs/GITHUB-SECRETS.md`
- Локально: `pnpm@9.15+`, `node@20+`, `docker`, `gh` CLI

## 2. Подготовка VM

**Минимальные характеристики staging:**
- Ubuntu 24.04 LTS
- 2 vCPU, 4 GB RAM, 30 GB SSD
- Public IP
- Зона `ru-central1-b` (Я.Облако)
- **Timezone: `Asia/Yekaterinburg`** (Уфа). Критично для `event_recurrence_rules.time_of_day`:
  ```bash
  sudo timedatectl set-timezone Asia/Yekaterinburg
  ```

**Базовый софт:**
```bash
sudo apt update && sudo apt install -y curl git ufw
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Caddy для HTTPS-проксирования
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

**Файрвол:**
```bash
sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443
sudo ufw enable
```

**DNS (A-records):**
- `staging.cityrnng.ru` → `<VM IP>`
- `api-staging.cityrnng.ru` → `<VM IP>` (или path `/api/v1` через тот же домен — см. §9)

## 3. Postgres + Redis

Два варианта:

**A. Managed PostgreSQL (рекомендую для prod):**
Я.Облако → Managed Service for PostgreSQL → Postgres 16 → 1 vCPU 4 GB. Отдельные базы `cityrnng_staging` и `cityrnng_prod`.

**B. Docker compose на той же VM (для staging хватит):**
```bash
sudo mkdir -p /opt/cityrnng && cd /opt/cityrnng
git clone git@github.com:amkilnur-lgtm/cityrnng.git .
docker compose up -d postgres redis
```

После запуска проверить:
```bash
docker exec -it cityrnng-postgres psql -U postgres -d cityrnng -c '\l'
docker exec -it cityrnng-redis redis-cli ping  # → PONG
```

**Connection string для `DATABASE_URL`:**
- Managed: `postgres://<user>:<pass>@rc1b-<id>.mdb.yandexcloud.net:6432/cityrnng_staging?sslmode=verify-full`
- Local docker: `postgres://postgres:postgres@localhost:5432/cityrnng`

## 4. Strava Dev Portal

1. Перейти https://www.strava.com/settings/api
2. Create application:
   - Application Name: `CITYRNNG Staging` (отдельные приложения для staging/prod!)
   - Website: `https://staging.cityrnng.ru`
   - **Authorization Callback Domain:** `staging.cityrnng.ru`
3. Скопировать `Client ID` → секрет `STRAVA_CLIENT_ID`
4. Скопировать `Client Secret` → секрет `STRAVA_CLIENT_SECRET`
5. **`STRAVA_REDIRECT_URI`:** `https://staging.cityrnng.ru/integrations/strava/callback`
   ⚠️ Не на API! Frontend route принимает редирект и проксирует в API GET `/integrations/strava/callback`, потом редиректит юзера на `/app/profile?strava=connected`. См. `apps/web/src/app/integrations/strava/callback/route.ts`.

## 5. Сборка образов

В корне репо есть `package.json`-скрипты, но **Dockerfile-ов пока нет**. До их создания (TODO для отдельного PR) можно собрать локально и тащить через rsync, либо использовать GitHub Actions без registry.

**Минимальный Dockerfile-skeleton** (для будущего):
```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @cityrnng/api
COPY apps/api ./apps/api
RUN pnpm --filter @cityrnng/api prisma generate
RUN pnpm --filter @cityrnng/api build
EXPOSE 4000
CMD ["pnpm", "--filter", "@cityrnng/api", "start:prod"]
```

```dockerfile
# apps/web/Dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter @cityrnng/web
COPY apps/web ./apps/web
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter @cityrnng/web build
EXPOSE 3000
CMD ["pnpm", "--filter", "@cityrnng/web", "start"]
```

## 6. Env переменные

Создать на сервере `/opt/cityrnng/.env.staging` и `/opt/cityrnng/.env.production` (не коммитятся!). Полный реестр секретов — `docs/GITHUB-SECRETS.md`. Минимум:

```bash
# /opt/cityrnng/.env.staging — пример
NODE_ENV=production
TZ=Asia/Yekaterinburg

# API
API_PORT=4000
DATABASE_URL=postgres://cityrnng:<pass>@localhost:5432/cityrnng_staging
JWT_ACCESS_SECRET=<openssl rand -hex 32>
JWT_REFRESH_SECRET=<openssl rand -hex 32>
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=30
LOGIN_CHALLENGE_TTL_MINUTES=15
AUTH_DEV_RETURN_TOKEN=false   # ⚠️ false на проде!
TOKEN_ENCRYPTION_KEY=<openssl rand -base64 32>
STRAVA_CLIENT_ID=<from Dev Portal>
STRAVA_CLIENT_SECRET=<from Dev Portal>
STRAVA_REDIRECT_URI=https://staging.cityrnng.ru/integrations/strava/callback
STRAVA_SCOPES=read,activity:read
WELCOME_BONUS_POINTS=50
EVENT_ATTENDANCE_REGULAR_POINTS_FALLBACK=30
EVENT_ATTENDANCE_SPECIAL_POINTS_FALLBACK=50

# Web
NEXT_PUBLIC_API_URL=https://staging.cityrnng.ru/api/v1
```

Права:
```bash
sudo chmod 600 /opt/cityrnng/.env.staging
sudo chown root:docker /opt/cityrnng/.env.staging
```

## 7. Миграции БД

Все миграции лежат в `apps/api/prisma/migrations/`, применяются по порядку. На 2026-04-25:

```
20260414120000_login_challenges
20260414140000_events_and_sync_rules
20260416100000_city_locations_and_rule_locations
20260416130000_points_ledger
20260425160000_event_recurrence_rules   ← последняя
```

Применить:
```bash
cd /opt/cityrnng/apps/api
DATABASE_URL=$DATABASE_URL pnpm prisma migrate deploy
```

⚠️ `migrate deploy` (не `dev`!) на проде — он только применяет существующие, не генерит новые.

После каждого нового PR с миграцией — повторить.

## 8. Seed: роли + локации + recurrence rule

Сейчас `apps/api/prisma/seed.ts` закладывает только роли. Для прода **нужно расширить** — добавить:

1. 3 `city_locations` (Уфа: Центр / Проспект / Черниковка) — с `lat/lng/radius_meters` для Strava-геофенса
2. Один `event_recurrence_rules` (среда 19:30 90 мин regular) с тремя локациями через junction
3. Опционально промоут админ-юзера через `SEED_ADMIN_EMAIL`

Пример вызова после расширения:
```bash
SEED_ADMIN_EMAIL=admin@cityrnng.ru pnpm --filter @cityrnng/api prisma db seed
```

> **TODO**: расширить `prisma/seed.ts` под прод. Сейчас фронт держит эти данные в `apps/web/src/lib/home-mock.ts` — миграция на API убирает эти моки в БД.

## 9. Запуск сервисов + reverse proxy

**Запуск контейнеров:**
```bash
cd /opt/cityrnng
docker compose --env-file .env.staging up -d  # postgres + redis + api + web
```

(Сейчас `docker-compose.yml` содержит только postgres + redis. Сервисы api/web нужно добавить — TODO для отдельного PR; до этого — поднимать напрямую через `pnpm` под systemd.)

**Caddy reverse proxy** — `/etc/caddy/Caddyfile`:
```
staging.cityrnng.ru {
    encode gzip

    # API под /api/v1
    handle /api/* {
        reverse_proxy localhost:4000
    }

    # Frontend
    handle {
        reverse_proxy localhost:3000
    }
}
```

```bash
sudo systemctl reload caddy
# Caddy автоматически получит Let's Encrypt SSL сертификат при первом запросе
```

**Smoke check:**
```bash
curl https://staging.cityrnng.ru/api/v1/health
# {"status":"ok"}

curl https://staging.cityrnng.ru/
# HTML главной страницы
```

## 10. Critical gap: email канал

> ⚠️ **На проде magic-link не сработает.** В `apps/api/src/auth/` нет кода отправки писем — `POST /auth/request-login` создаёт `login_challenge` в БД, но письмо не уходит. Юзер не получает токен → не залогинится.

**Workaround на staging для тестов:**
```bash
AUTH_DEV_RETURN_TOKEN=true  # в .env.staging
```
Тогда токен возвращается прямо в HTTP-ответе (frontend подхватывает и в SentView показывает дев-ссылку). Подходит чтобы протестировать полный flow до подключения email.

**Перед prod нужно:**
1. Выбрать провайдер: Я.Postbox (SMTP), Я.Cloud Functions + SES, Mailgun, SendPulse
2. Реализовать `MailerService` в `apps/api/src/auth/` с шаблоном письма
3. Дёрнуть `MailerService.sendMagicLink()` в `AuthService.requestLogin()` после создания challenge
4. Добавить env переменные провайдера в `envSchema` + `GITHUB-SECRETS.md`
5. Тест с настоящим ящиком до production deploy

Это **блокер для production**. Можно стартовать staging с `AUTH_DEV_RETURN_TOKEN=true`, реализацию email — отдельным PR.

## 11. Health checks

API:
- `GET /api/v1/health` → `{"status":"ok"}`
- `GET /api/v1/health/db` → `{"status":"ok","db":"ok"}` (503 если БД недоступна)

Web:
- `GET /` → 200 OK + HTML

Smoke-test после deploy:
```bash
#!/usr/bin/env bash
set -e
HOST=${1:-https://staging.cityrnng.ru}
curl -fsS "$HOST/api/v1/health" | grep -q '"status":"ok"'
curl -fsS "$HOST/api/v1/health/db" | grep -q '"db":"ok"'
curl -fsSI "$HOST/" | head -1 | grep -q '200'
echo "OK $HOST"
```

## 12. Backup

**До production обязательно:**
- Cron на VM: `pg_dump` + загрузка в Я.Object Storage 1×/сутки
- Retention: 14 дней daily + 12 weekly + 12 monthly
- Тест восстановления раз в месяц на отдельной БД

Минимальный скрипт:
```bash
#!/usr/bin/env bash
TS=$(date +%Y%m%d-%H%M%S)
pg_dump $DATABASE_URL | gzip > /tmp/cityrnng-$TS.sql.gz
aws --endpoint-url=https://storage.yandexcloud.net s3 cp /tmp/cityrnng-$TS.sql.gz s3://cityrnng-backups/
rm /tmp/cityrnng-$TS.sql.gz
```

## 13. Логирование и observability

**Минимум для staging:**
- Docker logs: `docker compose logs -f api web` (rotation в Я.Облако)
- Caddy access log: `/var/log/caddy/access.log`

**Перед prod:**
- Sentry для api + web (см. `SENTRY_DSN` в GITHUB-SECRETS.md)
- Я.Метрика на frontend
- PostHog (продуктовая аналитика) — отдельный эпик 8

## 14. Откат / hotfix

**Откатить deploy:**
```bash
cd /opt/cityrnng
git fetch
git checkout <previous-good-sha>
docker compose --env-file .env.staging up -d --build
```

**Откатить миграцию:**
Prisma не делает rollback автоматически. Нужно:
1. Создать новую миграцию которая убирает изменения
2. Или вручную через `psql` — выполнить обратные DDL
3. Никогда не делать `migrate reset` на проде (стирает БД!)

**Hotfix без полного передеплоя:** менять переменные `.env.*` + `docker compose restart <service>` на конкретном сервисе.

---

## Чек-лист первого staging-deploy

- [ ] VM 2vCPU/4GB поднят, TZ=Asia/Yekaterinburg
- [ ] DNS `staging.cityrnng.ru` → IP
- [ ] Docker + Caddy установлены
- [ ] Postgres + Redis запущены (managed или docker)
- [ ] Strava Dev Portal: app создан, redirect URI на frontend wrapper
- [ ] `.env.staging` собран по реестру `GITHUB-SECRETS.md`
- [ ] Repo склонирован в `/opt/cityrnng`
- [ ] `pnpm install`, `pnpm --filter @cityrnng/api prisma migrate deploy`
- [ ] `pnpm --filter @cityrnng/api prisma db seed` (после расширения seed)
- [ ] API + Web подняты (через systemd или docker-compose)
- [ ] Caddyfile настроен, SSL получен автоматически
- [ ] `curl /api/v1/health` → 200
- [ ] `curl /` → 200
- [ ] Опционально: `AUTH_DEV_RETURN_TOKEN=true` для прохода magic-link до email-интеграции
- [ ] Backup-cron заведён
- [ ] Sentry подключён (опционально для staging)

После прохождения чек-листа — staging готов. Следующий этап: реализовать email + повторить чек-лист для production.
