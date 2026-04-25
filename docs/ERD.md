# ERD and Data Model: CITYRNNG

Документ описывает фактическую модель данных в `apps/api/prisma/schema.prisma` на момент последней синхронизации. Таблицы, находящиеся в продуктовом roadmap, но ещё не реализованные, вынесены в отдельную секцию `Planned`, чтобы не путать текущее состояние схемы с будущими планами.

## 1. Реализованные сущности

### Users and identity

- `users`
- `profiles`
- `roles`
- `user_roles`
- `login_challenges`
- `sessions`

### Events and attendance

- `events`
- `event_sync_rules`
- `event_sync_rule_locations`
- `event_recurrence_rules`
- `event_recurrence_rule_locations`
- `event_attendances`
- `city_locations`

### External integrations

- `user_provider_accounts`
- `external_activities`

### Loyalty

- `point_accounts`
- `point_transactions`

### Rewards & Partners (Epic 5)

- `partners`
- `rewards`
- `redemptions`

## 2. Реализованные таблицы

## `users`

- `id`
- `email` unique
- `phone` unique nullable
- `status` active|blocked|pending
- `created_at`
- `updated_at`

## `profiles`

- `id`
- `user_id` unique
- `display_name`
- `first_name` nullable
- `last_name` nullable
- `city` nullable
- `birth_date` nullable
- `avatar_media_id` nullable (поле зарезервировано, хранилище медиа ещё не реализовано)
- `instagram_handle` nullable
- `telegram_handle` nullable
- `consent_personal_data_at` nullable
- `consent_marketing_at` nullable

## `roles`

- `id`
- `code` unique (`runner` | `admin` | `partner`)
- `name`

Посев ролей выполняется идемпотентным скриптом `apps/api/prisma/seed.ts` (`pnpm --filter @cityrnng/api prisma:seed`).

## `user_roles`

- `user_id`
- `role_id`
- primary key (`user_id`, `role_id`)

## `login_challenges`

Короткоживущие токены magic-link логина.

- `id`
- `email` (индекс)
- `token_hash` unique
- `expires_at`
- `consumed_at` nullable
- `created_at`

## `sessions`

- `id`
- `user_id` (индекс)
- `refresh_token_hash` unique
- `status` active|revoked|expired
- `user_agent` nullable
- `ip_address` nullable
- `expires_at`
- `created_at`
- `revoked_at` nullable

## `events`

- `id`
- `title`
- `slug` unique
- `description` nullable
- `type` regular|special|partner
- `status` draft|published|started|finished|cancelled
- `starts_at`
- `ends_at`
- `location_name` nullable
- `location_address` nullable
- `location_lat` nullable
- `location_lng` nullable
- `capacity` nullable
- `registration_open_at` nullable
- `registration_close_at` nullable
- `is_points_eligible`
- `base_points_award`
- `created_by` (user)
- `recurrence_rule_id` nullable (FK → `event_recurrence_rules`, `on delete SET NULL`)
- `overrides_occurrence_at` DATE nullable — день рекуррентного события, который перекрывает данный override
- индексы: (`status`, `starts_at`), (`type`)
- UNIQUE (`recurrence_rule_id`, `overrides_occurrence_at`) — один override на правило × дату

## `event_recurrence_rules`

Шаблон повторяющихся событий. Материализуется на лету через `EventOccurrenceService.listUpcoming()` — без записи на каждое вхождение, пока admin не создаст явный `events`-row, который перекроет конкретную дату.

- `id`
- `title`
- `type` regular|special|partner — обычно `regular`
- `status` active|paused (индекс с `day_of_week`)
- `day_of_week` 0–6 (Sun=0 … Sat=6, как `Date.getDay`)
- `time_of_day` HH:MM в локальной таймзоне сервера (deploy в TZ клуба, см. DEPLOY-RUNBOOK)
- `duration_minutes`
- `is_points_eligible`
- `base_points_award`
- `starts_from_date` DATE — с какой даты правило активно
- `ends_at_date` DATE nullable — sunset
- `created_by` (user)
- `created_at`, `updated_at`

## `event_recurrence_rule_locations`

Junction правило ↔ `city_locations`. Все локации правила инлайнятся в каждое материализованное вхождение.

- `rule_id`
- `location_id`
- `created_at`
- primary key (`rule_id`, `location_id`)

## `event_sync_rules`

Конфигурация сопоставления активности из внешних провайдеров (сейчас — Strava) с событием.

- `id`
- `event_id` unique
- `provider` strava
- `activity_type` nullable
- `min_distance_meters` nullable
- `max_distance_meters` nullable
- `min_duration_seconds` nullable
- `max_duration_seconds` nullable
- `window_starts_at`
- `window_ends_at`
- `geofence_lat` nullable (устаревший inline-геофенс)
- `geofence_lng` nullable
- `geofence_radius_meters` nullable
- `auto_approve`
- `created_at`
- `updated_at`

## `event_sync_rule_locations`

Связь правила синхронизации с набором именованных локаций (современный способ геофенса).

- `sync_rule_id`
- `location_id` (индекс)
- `created_at`
- primary key (`sync_rule_id`, `location_id`)

## `city_locations`

- `id`
- `name`
- `slug` unique
- `city` (индекс)
- `lat`
- `lng`
- `radius_meters` nullable
- `status` active|archived (индекс)
- `created_at`
- `updated_at`

## `event_attendances`

Замена классической пары `event_registrations` + `checkins`. Запись создаётся либо автоматически при матчинге Strava-активности, либо вручную администратором.

- `id`
- `event_id`
- `user_id`
- `external_activity_id` nullable (FK на `external_activities`, `on delete SET NULL`)
- `status` pending|approved|rejected
- `source` sync|manual_admin
- `matched_at` nullable
- `reviewed_at` nullable
- `reviewed_by` nullable (user)
- `rejection_reason` nullable
- `created_at`
- `updated_at`
- unique(`event_id`, `user_id`)
- индексы: (`event_id`, `status`), (`user_id`)

## `user_provider_accounts`

Подключение пользователя к внешнему провайдеру. Токены хранятся в зашифрованном виде (`TOKEN_ENCRYPTION_KEY`, AES-GCM).

- `id`
- `user_id`
- `provider` strava
- `provider_user_id`
- `access_token_encrypted` nullable
- `refresh_token_encrypted` nullable
- `token_expires_at` nullable
- `scope` nullable
- `connected_at`
- `disconnected_at` nullable
- unique(`user_id`, `provider`)
- unique(`provider`, `provider_user_id`)

## `external_activities`

Нормализованные записи активностей, полученных от провайдера.

- `id`
- `user_provider_account_id`
- `user_id`
- `provider`
- `external_id`
- `activity_type` nullable
- `started_at`
- `elapsed_seconds`
- `distance_meters`
- `start_lat` nullable
- `start_lng` nullable
- `end_lat` nullable
- `end_lng` nullable
- `payload_json` (сырой ответ провайдера)
- `ingested_at`
- unique(`provider`, `external_id`)
- индекс: (`user_id`, `started_at`)

## `point_accounts`

- `id`
- `user_id` unique
- `status` active|blocked
- `balance` int (снэпшот для быстрых запросов; истина — `point_transactions`)
- `created_at`
- `updated_at`

## `point_transactions`

Главный источник истины для баллов. Все операции идут через сервис `PointsService.post` с обязательным `idempotency_key`.

- `id`
- `account_id`
- `user_id`
- `direction` credit|debit
- `amount` int positive
- `balance_after` int
- `status` posted|reversed
- `reason_type`
- `reason_ref` nullable (ссылка на доменную сущность, например `attendance.id`)
- `idempotency_key` unique
- `comment` nullable
- `created_by_type` system|admin
- `created_by_id` nullable (user)
- `created_at`
- индексы: (`user_id`, `created_at DESC`, `id DESC`), (`account_id`, `created_at DESC`, `id DESC`), (`reason_type`)

Значения `reason_type` из enum `PointReasonType`:

- `signup_bonus`
- `event_attendance_regular`
- `event_attendance_special`
- `event_attendance_partner` (reason-type зарезервирован, авто-начисление пока отключено)
- `first_run_bonus` (зарезервирован)
- `streak_bonus` (зарезервирован)
- `milestone_bonus` (зарезервирован)
- `returning_user_bonus` (зарезервирован)
- `campaign_bonus` (зарезервирован)
- `partner_bonus` (зарезервирован)
- `reward_redemption` — debit при обмене баллов на reward (см. `redemptions`)
- `manual_adjustment`
- `reversal`

## `partners`

- `id`
- `slug` unique
- `name`
- `description` nullable
- `contact_email` nullable
- `status` active|archived (индекс)
- `created_by` (user)
- `created_at`, `updated_at`

## `rewards`

- `id`
- `slug` unique
- `partner_id` (индекс, FK → `partners`, `on delete CASCADE`)
- `title`
- `description` nullable
- `cost_points` int positive
- `badge` nullable (короткая метка вроде "до 31 мая")
- `status` active|archived (индекс)
- `valid_from` nullable
- `valid_until` nullable
- `capacity` nullable (если NULL — без лимита)
- `sold_count` int default 0 — инкрементируется при `redemption.create`, декрементируется при cancel
- `created_by` (user)
- `created_at`, `updated_at`

## `redemptions`

Запись об обмене баллов на reward. Создаётся атомарно вместе с debit `point_transactions`.

- `id`
- `user_id` (FK, `on delete RESTRICT` — историю обменов не теряем)
- `reward_id` (FK, `on delete RESTRICT`)
- `cost_points` — снимок цены на момент обмена (reward.cost_points может измениться)
- `status` active|used|expired|cancelled (индекс с `expires_at`)
- `code` unique — 6-char alphanumeric uppercase, payload для QR
- `point_txn_id` unique (FK → `point_transactions`)
- `expires_at` nullable — по умолчанию +7 дней
- `used_at`, `used_by_id` nullable — кто пометил использованным (партнёр / админ)
- `cancelled_at`, `cancelled_reason` nullable
- `created_at`, `updated_at`
- индексы: (`user_id`, `created_at DESC`), (`reward_id`, `status`), (`status`, `expires_at`)

## 3. Ключевые связи

- `users 1:1 profiles`
- `users 1:N sessions`
- `users N:M roles` (через `user_roles`)
- `users 1:1 point_accounts`
- `users 1:N point_transactions`
- `users 1:N user_provider_accounts`
- `users 1:N external_activities`
- `users 1:N event_attendances` (с ролями автор / ревьюер)
- `events 1:1 event_sync_rules` (optional)
- `events 1:N event_attendances`
- `event_sync_rules N:M city_locations` (через `event_sync_rule_locations`)
- `user_provider_accounts 1:N external_activities`
- `external_activities 1:N event_attendances`

## 4. Транзакционная модель баллов

Баллы нельзя хранить только как вычисляемое поле в `users`.

Правила реализации:

- источник истины — `point_transactions`;
- `point_accounts.balance` обновляется атомарно внутри транзакции вместе с записью в `point_transactions`;
- каждая запись `point_transactions` содержит `balance_after` (снэпшот баланса после операции);
- списание (`direction=debit`) возможно только внутри транзакции БД с проверкой достаточности баланса;
- каждая операция обязана иметь `idempotency_key`; повторная попытка с тем же ключом возвращает существующую запись;
- все отмены выполняются отдельной обратной записью с `reason_type=reversal`, сама запись не удаляется.

## 5. Правила целостности

- Один пользователь не может иметь более одной записи `event_attendances` на одно событие (unique `event_id, user_id`).
- Strava-активность не может быть импортирована дважды (unique `provider, external_id`).
- Один пользователь может быть подключён к одному провайдеру только один раз (unique `user_id, provider`) и один внешний аккаунт не может быть подключён к двум пользователям (unique `provider, provider_user_id`).
- Одна и та же причина начисления не должна выполняться дважды при одинаковом `idempotency_key`.
- Ручные корректировки баллов доступны только ролям `admin` / `superadmin`; запись обязана содержать `created_by_id`.

## 6. Событийная модель

Фактические доменные события, которые имеет смысл логировать (audit log — в секции `Planned`):

- `user_signed_up`
- `user_magic_link_requested`
- `event_created`
- `event_sync_rule_upserted`
- `strava_account_connected`
- `strava_account_disconnected`
- `external_activity_ingested`
- `attendance_matched`
- `attendance_approved`
- `attendance_rejected`
- `points_awarded`
- `manual_points_adjusted`

## 7. Что важно для Prisma schema

- `@@unique` для всех доменных инвариантов (см. раздел "Правила целостности");
- enum держим в Prisma, никаких `String` с магическими значениями;
- аудируемые поля (`created_at`, `updated_at`, `created_by_*`) обязательны на всех критичных таблицах;
- балльные и денежные значения — `Int`, не `Float`;
- мягкое удаление через поле `status`, hard delete только там, где нет истории (например, `login_challenges`, `external_activities` по ретенции).

## 8. Planned (ещё не реализовано)

Секция описывает сущности из продуктового roadmap, которые не существуют в текущей схеме. Перенесены сюда, чтобы сохранить продуктовое видение без смешивания с реальностью.

### Rewards and partners (Epic 5) — реализовано

`partners`, `rewards`, `redemptions` переехали в §2 как реализованные. См. ниже описание полей.

Из планируемого осталось:

- `partner_contacts` (если потребуется > 1 контакта на партнёра)
- `reward_inventory` (точное управление запасом — пока через `capacity` + `sold_count`)
- `reward_redemption_events` (audit log переходов статуса; пока статус хранится в `redemptions` напрямую + есть `point_transactions` как косвенный лог)

### Notifications (Epic 8)

- `notifications`

### Platform

- `media_files` (поле `profiles.avatar_media_id` зарезервировано заранее, само хранилище не реализовано)
- `audit_logs`
- `feature_flags`
- `event_routes`
- `point_rules` (сейчас правила начисления захардкожены в `PointsAwardsService` + env fallback; вынесение в таблицу — отдельная задача)

### Устаревшие решения (не реализуются в текущем виде)

Эти сущности были в ранней версии документа, но сознательно не реализованы в пользу другого подхода:

- `event_registrations` — пользователи не регистрируются на событие заранее; присутствие подтверждается через Strava-matching или ручной ввод администратором.
- `checkins` / `checkin_tokens` — QR-поток заменён на `event_attendances` + matcher (см. раздел 2).
- `auth_identities` — вынесено в `user_provider_accounts` + email-based magic-link, отдельная таблица для идентичностей не понадобилась.
