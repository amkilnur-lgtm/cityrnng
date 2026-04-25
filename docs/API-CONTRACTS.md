# API Contracts: CITYRNNG

Документ описывает фактические HTTP-эндпоинты, реализованные в `apps/api/src/**/*.controller.ts` на момент последней синхронизации. Эндпоинты из продуктового roadmap, ещё не реализованные, вынесены в секцию `Planned`.

## 1. Общие правила

- Глобальный префикс: `/api/v1` (см. `apps/api/src/main.ts`).
- Формат тела — JSON.
- Валидация DTO через `class-validator` + глобальный `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`) — неожиданные поля отклоняются с 400.
- Аутентификация: `Authorization: Bearer <accessToken>`. По умолчанию все роуты защищены глобальным `JwtAuthGuard`; публичные помечаются декоратором `@Public()`.
- Авторизация по роли: `@Roles('admin')` + `RolesGuard`. При несовпадении — `403 FORBIDDEN_ROLE`.
- Ошибки: стандартный envelope с `code`, `message`, опциональный `details`.

## 2. Auth (public)

### `POST /api/v1/auth/request-login`

Инициирует magic-link логин: создаёт `login_challenge`, возвращает подтверждение. В dev-режиме (`AUTH_DEV_RETURN_TOKEN=true`) дополнительно возвращает открытый токен — удобно для локальных тестов без почтового канала.

Request:

```json
{ "email": "user@example.com" }
```

Response `202 Accepted`:

```json
{
  "ok": true,
  "expiresAt": "2026-04-17T18:32:00.000Z",
  "devToken": "<plaintext-token, only when AUTH_DEV_RETURN_TOKEN=true>"
}
```

### `POST /api/v1/auth/verify-login`

Обменивает одноразовый токен на пару JWT. Идемпотентно создаёт пользователя, профиль, присваивает роль `runner`, начисляет welcome-бонус при первой активации.

Request:

```json
{ "token": "opaque-token" }
```

Response `200 OK`:

```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "roles": ["runner"]
  }
}
```

## 3. Profile

### `GET /api/v1/me`

Возвращает профиль и роли текущего пользователя. Требует access-токен.

## 4. Events (public)

### `GET /api/v1/events/upcoming?weeks=8`

**Materialized list** — recurring rule occurrences (e.g. «среда 19:30, 3 локации») merged with explicit `events` rows that override individual occurrences and standalone special events. Sorted by `startsAt` asc.

Returns `MaterializedEvent[]` where each item has:
- `id` — UUID for explicit events; synthetic `rule:<ruleId>:<YYYY-MM-DD>` for materialized occurrences (no DB row)
- `isMaterialized: boolean` — true for synthetic, false for explicit
- `title, type (regular|special|partner), status, startsAt, endsAt, isPointsEligible, basePointsAward, description`
- `locations: [{ id, name, city, lat, lng }]` — for materialized: from rule.locations; for explicit: from event.syncRule.locations (fallback to inherited rule's)
- `recurrenceRuleId, overridesOccurrenceAt` — set on explicit overrides

This endpoint is the source of truth for `/events` page and the home «next event» card. Use over `GET /events` for any forward-looking display.

### `GET /api/v1/events`

Список явно созданных опубликованных событий (не материализованных). Фильтры через query (см. DTO в `apps/api/src/events/dto`). Полезен для админ-обзора и как backward-compat — фронт мигрирует на `/events/upcoming`.

### `GET /api/v1/events/:id`

Детальная карточка явного события (UUID). Materialized-occurrences пока не имеют отдельного detail-эндпоинта — frontend использует список `/events/upcoming` и при необходимости резолвит на `/districts`.

## 5. Points

### `GET /api/v1/points/balance`

Текущий баланс пользователя.

Response:

```json
{ "balance": 650 }
```

### `GET /api/v1/points/history`

История транзакций с cursor-based пагинацией.

Query:

- `limit` (optional, int)
- `cursor` (optional, string — id последней транзакции предыдущей страницы)

Response — список транзакций ledger c полями `id, direction, amount, balanceAfter, reasonType, reasonRef, comment, createdAt` + `nextCursor` если есть ещё.

## 6. Integrations — Strava

### `GET /api/v1/integrations/strava/connect`

Возвращает URL для авторизации у Strava. State — подписанный JWT c TTL ~10 минут.

Response:

```json
{ "authorizeUrl": "https://www.strava.com/oauth/authorize?..." }
```

### `GET /api/v1/integrations/strava/callback` (public)

OAuth callback от Strava. Параметры `code` + `state` (или `error`). Обменивает код на токены, шифрует и сохраняет в `user_provider_accounts`.

### `GET /api/v1/integrations/strava/status`

Статус подключения текущего пользователя.

Response:

```json
{
  "connected": true,
  "providerUserId": "123",
  "scope": "read,activity:read",
  "connectedAt": "2026-04-01T12:00:00.000Z",
  "tokenExpiresAt": "2026-04-17T20:00:00.000Z"
}
```

либо `{ "connected": false }`.

### `DELETE /api/v1/integrations/strava/disconnect`

Отключает провайдера для текущего пользователя. Response `204 No Content`.

## 7. Health (public)

### `GET /api/v1/health`

```json
{ "status": "ok" }
```

### `GET /api/v1/health/db`

Пингует Postgres.

```json
{ "status": "ok", "db": "ok" }
```

При недоступности БД — `503` с тем же envelope, но `db !== "ok"`.

## 8. Admin — Events

Все ручки требуют роль `admin`.

### `POST /api/v1/admin/events`

Создание события (CreateEventDto).

### `PATCH /api/v1/admin/events/:id`

Частичное обновление события (UpdateEventDto).

### `PUT /api/v1/admin/events/:id/sync-rules`

Upsert правила синхронизации для события: параметры окна, границы distance/duration, автоapprove, связка с `city_locations`.

### `GET /api/v1/admin/events/:id/attendances`

Список `event_attendances` для события с фильтром по статусу.

Query:

- `status` optional (`pending` | `approved` | `rejected`)

## 9. Admin — Attendances

### `POST /api/v1/admin/attendances/:id/approve`

Подтверждает pending-attendance. Ставит `status=approved`, фиксирует ревьюера, идемпотентно начисляет баллы через `PointsAwardsService.awardEventAttendance`.

### `POST /api/v1/admin/attendances/:id/reject`

Отклоняет pending-attendance.

Request:

```json
{ "reason": "Активность вне окна события" }
```

## 10. Admin — Locations

### `GET /api/v1/admin/locations`

Список `city_locations` с фильтрами.

### `POST /api/v1/admin/locations`

Создание локации.

### `PATCH /api/v1/admin/locations/:id`

Обновление локации.

## 11. Admin — Points

### `POST /api/v1/admin/points/adjust`

Ручная корректировка баланса (audit-критично). Клиент обязан передавать `idempotencyKey`, иначе повторный запрос создаст дубликат.

Request:

```json
{
  "userId": "uuid",
  "direction": "credit",
  "amount": 100,
  "idempotencyKey": "unique-string",
  "comment": "Volunteer bonus"
}
```

Записывает `point_transactions.reason_type = manual_adjustment`, `created_by_type = admin`, `created_by_id = <admin-user-id>`.

## 12. Admin — Strava operations

Обе ручки синхронные, запускаются руками из админки. Фоновых джоб ещё нет.

### `POST /api/v1/admin/integrations/strava/sync`

Забирает активности пользователя из Strava, нормализует в `external_activities`, после чего сразу прогоняет matcher.

Request:

```json
{
  "userId": "uuid",
  "after": "2026-04-01T00:00:00.000Z",
  "before": "2026-04-17T00:00:00.000Z"
}
```

Response:

```json
{
  "ingestion": { "fetched": 42, "upserted": 7, "pages": 1 },
  "matching":  { "checked": 7, "matched": 1, "skipped": 6 }
}
```

### `POST /api/v1/admin/integrations/strava/match`

Только matcher, без нового обращения к Strava — прогоняет уже импортированные `external_activities` против текущих `event_sync_rules`. Полезно после правки правила.

## 13. Rewards & Partners (Epic 5)

### `GET /api/v1/partners` (public)

Список активных партнёров (status=active). Используется во фронте `/shop` для группировки.

### `GET /api/v1/rewards` (public)

Список активных наград от активных партнёров. Опциональный фильтр `?partner=<slug>`. Сортировка: партнёр (asc по name), затем `cost_points` (asc). Возвращает `Reward[]` с включённым `partner`.

### `GET /api/v1/rewards/:slug` (public)

Деталка награды. 404 если archived/inactive у reward или partner.

### `POST /api/v1/rewards/:slug/redeem` (authed)

Атомарно списывает баллы и создаёт `Redemption`. Тело:

```json
{ "idempotencyKey": "<uuid>" }
```

`idempotencyKey` опционален — если повторно прислан тот же, возвращается уже существующая redemption (для retry-safety). При пропуске сервер генерирует уникальный ключ.

Валидации (порядок проверки): reward.status=active, partner.status=active, valid_from <= now <= valid_until, capacity > sold_count, balance >= cost_points. На любую — `403`/`400` с доменным кодом.

Внутри транзакции:
1. `point_transactions.post` (debit, reasonType=`reward_redemption`, reasonRef=reward.id, idempotencyKey)
2. Генерация уникального 6-char alphanumeric `code` (5 retries при коллизии)
3. `redemptions.create` (link на `point_txn_id`, expires_at = +7 дней)
4. `rewards.sold_count++`

Response `201`:

```json
{
  "id": "uuid",
  "userId": "uuid",
  "rewardId": "uuid",
  "costPoints": 120,
  "status": "active",
  "code": "M4XKF7",
  "pointTxnId": "uuid",
  "expiresAt": "2026-05-02T19:30:00.000Z",
  "createdAt": "...",
  "reward": { ... include partner ... }
}
```

### `GET /api/v1/me/redemptions` (authed)

Список redemptions текущего юзера, отсортирован по `created_at` desc. Опциональный фильтр `?status=active`.

### `GET /api/v1/me/redemptions/:code` (authed)

Один redemption по 6-char коду (case-insensitive). 404 если код принадлежит другому юзеру.

### Admin (Roles: admin)

- `GET /api/v1/admin/partners` — все партнёры (включая archived)
- `POST /api/v1/admin/partners` — создать (`CreatePartnerDto`: slug, name, description?, contactEmail?, status?)
- `PATCH /api/v1/admin/partners/:id` — обновить
- `GET /api/v1/admin/rewards?partnerId=<uuid>` — все награды (включая archived)
- `POST /api/v1/admin/rewards` — создать (`CreateRewardDto`: slug, partnerId, title, description?, costPoints, badge?, status?, validFrom?, validUntil?, capacity?)
- `PATCH /api/v1/admin/rewards/:id` — обновить
- `POST /api/v1/admin/redemptions/verify/:code` — пометить redemption использованным (партнёр сканирует QR, админ подтверждает). Возвращает обновлённый redemption. Ошибки: `REDEMPTION_NOT_FOUND`, `REDEMPTION_NOT_ACTIVE`, `REDEMPTION_EXPIRED`
- `POST /api/v1/admin/redemptions/:id/cancel` — отменить + вернуть баллы. Тело `{ reason?: string }`. Создаёт credit-транзакцию `reasonType=reversal`, ставит `redemption.status=cancelled`, decrements `reward.sold_count`. Идемпотентно по `redemption.id`

Доменные коды (для `error.code`):
- `REWARD_NOT_FOUND`, `REWARD_SLUG_TAKEN`, `REWARD_NOT_AVAILABLE`, `REWARD_PARTNER_ARCHIVED`, `REWARD_NOT_YET_AVAILABLE`, `REWARD_EXPIRED`, `REWARD_SOLD_OUT`, `REWARD_INVALID_VALIDITY_RANGE`, `REWARD_PARTNER_INVALID`
- `PARTNER_NOT_FOUND`, `PARTNER_SLUG_TAKEN`
- `REDEMPTION_NOT_FOUND`, `REDEMPTION_NOT_ACTIVE`, `REDEMPTION_EXPIRED`, `REWARD_CODE_GENERATION_FAILED`
- `POINTS_INSUFFICIENT`

## 14. Error format

```json
{
  "error": {
    "code": "INSUFFICIENT_POINTS",
    "message": "Not enough points to redeem this reward",
    "details": {}
  }
}
```

## 15. Доменные коды ошибок

Реализованные (источник истины — `grep code: apps/api/src`):

Auth / RBAC:

- `AUTH_INVALID_TOKEN`
- `AUTH_SESSION_EXPIRED`
- `FORBIDDEN_ROLE`

Events / sync rules:

- `EVENT_NOT_FOUND`
- `EVENT_SLUG_TAKEN`
- `EVENT_INVALID_DATE_RANGE`
- `SYNC_RULE_INVALID_WINDOW`
- `SYNC_RULE_INVALID_DISTANCE_RANGE`
- `SYNC_RULE_INVALID_DURATION_RANGE`
- `SYNC_RULE_LOCATION_NOT_FOUND`
- `SYNC_RULE_LOCATION_ARCHIVED`
- `SYNC_RULE_INCOMPLETE_GEOFENCE`

Attendances:

- `ATTENDANCE_NOT_FOUND`
- `ATTENDANCE_ALREADY_REVIEWED`

Locations:

- `LOCATION_NOT_FOUND`
- `LOCATION_SLUG_TAKEN`

Strava:

- `STRAVA_NOT_CONNECTED`
- `STRAVA_AUTHORIZATION_DENIED`
- `STRAVA_CALLBACK_MISSING_CODE`
- `STRAVA_STATE_INVALID`
- `STRAVA_UPSTREAM_ERROR`

Points:

- `POINTS_ACCOUNT_BLOCKED`

Зарезервированы под Planned-эпики:

- `INSUFFICIENT_POINTS` (Epic 5 redemption)
- `REWARD_NOT_AVAILABLE` (Epic 5)
- `REWARD_ALREADY_REDEEMED` (Epic 5)

## 16. Planned (ещё не реализовано)

Эндпоинты из продуктового roadmap, которые не существуют в текущем коде. Оставлены как reference для будущих эпиков.

### Auth / Sessions (Epic 1 follow-up)

- `POST /api/v1/auth/refresh` — ротация refresh-токена
- `POST /api/v1/auth/logout` — отзыв сессии
- `PATCH /api/v1/me/profile` — редактирование профиля

### Events — user flow (не планируется в текущем виде)

- `POST /api/v1/events/:id/register` / `DELETE /api/v1/events/:id/register` — заменены Strava-matching'ом. Пользователь не регистрируется заранее, а сопоставляется через синк активности.
- `POST /api/v1/checkins/scan` — QR-flow отменён в пользу `event_attendances` + matcher.
- `POST /api/v1/admin/events/:id/checkin-token` — аналогично.

### Rewards and partners (Epic 5) — реализовано

См. §13 выше. Перенесено из Planned в actual.

### Event status transitions (Epic 6 admin)

- `POST /api/v1/admin/events/:id/publish`

### Admin points — history view (Epic 6)

- `GET /api/v1/admin/points/transactions` с фильтрами по пользователю/причине.
