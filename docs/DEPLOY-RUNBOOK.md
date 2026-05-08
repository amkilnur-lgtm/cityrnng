# Deploy Runbook — CITYRNNG

Пошаговый гайд по подъёму staging/production окружения. Цель: первый рабочий staging за 1-2 часа после получения VM. Production — после прогона staging хотя бы неделю.

> **Status (2026-04-28):** инструкция написана под текущий код. Email-канал для magic-link реализован — настройки в §10.

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
10. [Email канал (magic-link)](#10-email-канал-magic-link)
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

Готовые multi-stage Dockerfile-ы лежат в `apps/api/Dockerfile` и `apps/web/Dockerfile`. Сборка из корня репо:

```bash
# API: ~150MB (alpine + dist + prisma engines)
docker build -f apps/api/Dockerfile -t cityrnng-api:staging .

# Web: ~120MB (Next.js standalone)
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://api.cityrnng.ru/api/v1 \
  -t cityrnng-web:staging .
```

**Что важно знать про образы:**
- API-контейнер при старте сам прогоняет `prisma migrate deploy`, потом `node dist/main.js`. Идемпотентно — на свежей БД проигрывает все миграции, на актуальной не делает ничего. `prisma` CLI вынесен в `dependencies` (а не devDeps) специально для этого шага.
- Web-контейнер использует Next standalone output — никаких `node_modules` в runtime, только `server.js` с зависимостями, проинлайненными билдером.
- Оба контейнера бегут под non-root юзером `app:1001` и используют `tini` как PID 1.

**Локальная проверка через compose:**
```bash
# поднять postgres + redis + api + web одной командой
APP_ENV_FILE=.env docker compose --profile app up -d --build

# или только данные (как раньше)
docker compose up -d postgres redis
```
Сервисы `api`/`web` сидят за compose-профилем `app`, чтобы дев-флоу с одним лишь Postgres не сломался.

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

## 8. Seed: роли + локации + партнёры + награды + recurrence rule

`apps/api/prisma/seed.ts` идемпотентно (везде `upsert`) засевает:

1. Роли: `runner`, `admin`, `partner` (всегда)
2. 3 `city_locations` (Уфа: Центр / Проспект / Черниковка с `lat/lng/radiusMeters` для Strava-геофенса) (всегда)
3. Партнёров и каталог наград (Monkey Grinder · Surf Coffee, 8 позиций) — **только если** `SEED_ADMIN_EMAIL` указан и юзер с этим email уже существует в БД
4. Админ-промоут указанного юзера до роли `admin` — **то же гейтование**
5. Дефолтное `event_recurrence_rules` (среда 19:30, 75 мин, regular, все три локации) — **то же гейтование**

Двухшаговый bootstrap нужен потому, что записи (4) и (5) требуют валидного `createdById` — то есть админ должен сначала залогиниться через magic-link, чтобы появиться в БД, и только потом seed может прицепить к нему контент.

**Запуск из CI/CD:** seed автоматически выполняется на каждый push в `main` через `.github/workflows/deploy-staging.yml` (шаг `Seed (idempotent)`) после `up -d`. Условие — переменная `SEED_ADMIN_EMAIL` должна быть в `.env.staging` на VM.

**Ручной запуск (локально или для бутстрапа):**
```bash
# локально, против локальной БД из ../../.env
SEED_ADMIN_EMAIL=you@example.com pnpm --filter @cityrnng/api prisma:seed

# на VM против стейджинг-БД (внутри api контейнера)
docker compose --env-file .env.staging exec -T api npx prisma db seed
```

В прод-контейнере `tsx` находится в `dependencies`, поэтому `prisma db seed` (`tsx prisma/seed.ts` per `package.json prisma.seed`) выполняется без devDeps.

## 9. Запуск сервисов + reverse proxy

**Запуск контейнеров:**
```bash
cd /opt/cityrnng
APP_ENV_FILE=.env.staging \
NEXT_PUBLIC_API_URL=https://api.staging.cityrnng.ru/api/v1 \
docker compose --profile app up -d --build  # postgres + redis + api + web
```

`api`/`web` сидят за compose-профилем `app`, чтобы случайный `docker compose up` не задел их без явного флага.

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

## 10. Email канал (magic-link)

Реализован в `apps/api/src/email/` через провайдер-абстракцию. `EMAIL_PROVIDER` выбирает между `console` (dev-default — пишет в stdout) и `smtp` (prod — nodemailer).

**Dev / локально (без SMTP):**
```bash
EMAIL_PROVIDER=console
WEB_BASE_URL=http://localhost:3000
```
В логе API появится `[email:console] to=… subject=…` с полной ссылкой. Нажми её в терминале и попадёшь на `/auth/verify`.

Альтернатива: `AUTH_DEV_RETURN_TOKEN=true` — токен возвращается прямо в HTTP-ответе на `POST /auth/request-login`, фронт подхватывает и показывает дев-ссылку. Удобно для e2e-тестов.

**Staging / production:**
```bash
EMAIL_PROVIDER=smtp
WEB_BASE_URL=https://cityrnng.ru
EMAIL_FROM=CITYRNNG <noreply@cityrnng.ru>
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_SECURE=true            # implicit TLS на 465; 587 → STARTTLS, ставь false
SMTP_USER=noreply@cityrnng.ru
SMTP_PASS=…                 # пароль приложения, не от ящика
AUTH_DEV_RETURN_TOKEN=false # ⚠️ обязательно false на проде
```
SMTP-провайдер делает `transporter.verify()` при старте и логирует ошибку (без падения процесса), если SMTP временно недоступен.

**Чек после деплоя:**
1. Запросить magic-link с настоящим ящиком (`POST /auth/request-login`).
2. Проверить, что письмо пришло и кнопка ведёт на `${WEB_BASE_URL}/auth/verify?token=…`.
3. Залогиниться по ссылке, проверить, что cookies проставились.

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
APP_ENV_FILE=.env.staging \
docker compose --profile app up -d --build
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
- [ ] Email: `EMAIL_PROVIDER=smtp`, `WEB_BASE_URL`, SMTP_* настроены и приходят письма
- [ ] Backup-cron заведён
- [ ] Sentry подключён (опционально для staging)

После прохождения чек-листа — staging готов. Следующий этап: повторить чек-лист для production.
