# Backlog and Delivery Plan: CITYRNNG

## 1. Принцип планирования

Работа идет эпиками. Каждый эпик должен завершаться работающим вертикальным срезом, а не просто набором файлов.

## 2. Эпики

Статусы: ✅ done · 🔄 partial · ⭕ pending

| Эпик | Статус | Комментарий |
|---|---|---|
| 0. Foundation | ✅ | монорепо, docker-compose, CI, env loader |
| 1. Auth & Profiles | 🔄 | API: magic-link с реальной отправкой email (✅ канал подключен 2026-05-06), sessions, `/me`, profiles + `PATCH /me`, roles + seed. **Frontend:** `/auth` + `/auth/verify`, httpOnly cookies, logout, `/app/profile` view + edit (server actions). Пока нет: `/auth/refresh`, `/auth/logout` API endpoints |
| 2. Events | 🔄 | API: admin CRUD + sync-rules + attendances. **Recurrence (Stage G):** `event_recurrence_rules` + materialized `GET /events/upcoming` ✅. Регистрация заменена на Strava-matching. **Frontend:** `/events` list + `/events/[id]` detail с Badge regular/special/partner ✅. Admin UI для recurrence-rules ✅ (см. Epic 6). Не хватает: публичная detail-страница для materialized rule occurrences (`rule:UUID:DATE`) |
| 3. Check-in | 🔄 заменён | QR-поток отменён. Вместо него: Strava connect → ingestion → `AttendanceMatcherService` → `event_attendances` (auto_approve или ручной approve админом). **Frontend:** `/app/profile` со StravaCard (connect/disconnect через server actions), `/integrations/strava/callback` Next.js wrapper для OAuth-редиректа |
| 4. Points Engine | 🔄 | Ledger + idempotency, `signup_bonus`, `event_attendance_*`, `manual_adjustment`, `/points/balance`, `/points/history`, admin adjust. **Frontend:** `/app/points` с балансом + Load-more пагинацией. Пока нет: first-run / streak / milestone / returning / campaign / partner bonus'ов, reversal flow, `point_rules` как таблица |
| 5. Rewards & Partners | 🔄 backend ✅ / frontend ✅ моки | **Backend:** `partners`, `rewards`, `redemptions` таблицы + `reward_redemption` enum value + миграция. `RewardsService` (public + admin), `PartnersService` (admin), `RedemptionsService` (атомарный redeem с debit point_transactions, idempotency, retry на code-collision, cancel+refund). Endpoints: `GET /partners`, `GET /rewards`, `GET /rewards/:slug`, `POST /rewards/:slug/redeem` (authed), `GET /me/redemptions`, `GET /me/redemptions/:code`, admin CRUD + `verify/:code` + `cancel/:id`. **Frontend:** `/shop` + `/shop/[slug]` + `/app/rewards` собраны на моках; ждут switch на API + добавления seed-данных в prisma/seed.ts |
| 6. Admin Panel | ✅ | UI собран в `apps/web/src/app/admin/`: CRUD для locations / partners / rewards / events / recurrence-rules + функциональные attendances (approve/reject), points (manual debit/credit с idempotency), users (grant/revoke ролей), redemptions (фильтры + verify + cancel с возвратом баллов). Dashboard `/admin` показывает все 9 разделов. Таблицы скроллятся горизонтально на mobile. |
| 7. Marketing Site | ✅ | Главная (guest+authed), `/auth`, `/events`, `/events/[id]`, `/how-it-works`, `/about`, `/faq`, `/partners`, `/districts` (с Я.Картами), `/journal` + `/journal/[id]`, `/shop`, `/terms`+`/privacy`+`/agreement` (stubs). Дев-toggle `[GUEST\|AUTHED]` для проверки authed-видов без API. C3 design system (Manrope/Space Grotesk/JetBrains Mono + tokens) |
| 8. Notifications & Analytics | 🔄 | Email-канал для magic-link подключен ✅ (2026-05-06) — прод-логин разблокирован. Пока нет: транзакционные письма для других сценариев (reward redemption, event reminders), аналитика |

## Q. Frontend-only stage map (актуально на 2026-05-13)

UI и backend сошлись по всем стабам — ни одной фронтовой заглушки без логики не осталось. Раздел оставлен как trail для будущих расхождений.

✅ Закрыто:
- ~~Edit profile UI~~ — `PATCH /me` + форма работают
- ~~Admin panel целиком~~ — locations/partners/rewards/events/recurrence CRUD собран
- ~~Recurrence rules admin~~ — собран в `/admin/recurrence/`
- ~~Email-доставка magic-link~~ — канал подключен 2026-05-06, прод-логин разблокирован
- ~~Switch `/shop` + `/app/rewards` с моков на API~~ — фронт API-first, моки только fallback. Seed данных партнёров/наград автоматизирован через `deploy-staging.yml` (см. DEPLOY-RUNBOOK §8) и `apps/api/prisma/seed.ts`.
- ~~Admin stubs (`/admin/attendances`, `/admin/points`, `/admin/users`)~~ — все три полностью функциональны: approve/reject attendance, ручной debit/credit с idempotency-key, grant/revoke ролей.
- ~~Публичная detail-страница для materialized recurrence-occurrences (`/events/rule:UUID:DATE`)~~ — `GET /events/:id` принимает оба формата (UUID и `rule:UUID:DATE`); правило с override отдаётся override'ом, иначе материализуется из `EventRecurrenceRule`.

Дополнительно влито: идемпотентный Prisma seed для ролей `runner/admin/partner` + опциональное повышение known-email в admin (`SEED_ADMIN_EMAIL`). Это prerequisite для admin-protected flows, не самостоятельный эпик.

## R. Phase 2 hardening + new features (2026-05-08–09)

**Phase 2 hardening — закрыты пункты 1, 2, 6:**
- PR #48 — rate-limit `/auth/request-login` (3/мин), `/rewards/:slug/redeem` (10/мин), 100/мин global backstop, `trust-proxy=loopback`.
- PR #49 — refresh-token flow с rotation: `POST /auth/refresh` + `/auth/logout`, web middleware прозрачно меняет access-токен.
- PRs #50/51/52/55/56 — observability live: `@sentry/nestjs` + `nestjs-pino` + `/health/email` на API; `@sentry/nextjs` (browser + server + edge) на web; два Sentry-проекта (`cityrnng-api`, `cityrnng-web`). `tunnelRoute` отключён — VPS таймаутит outbound в `34.160.0.0/16` (GCP), нужно отдельно дебажить.

**Phase 2 — осталось:** admin_audit_log, backup automation, email deliverability (DKIM/SPF/DMARC), VPS egress fix.

**Bonus features (часть Phase 3 + UX-improvements) — закрыто 2026-05-09:**
- PR #72 — копирайт-pass: 11 правок hero/auth/events/shop/footer/how-it-works.
- PR #73 — RSVP «Я иду»: новая модель `EventInterest` (`userId`, `eventKey: string`, `locationId`, `status`). `eventKey` поддерживает и UUID-события, и `rule:UUID:YYYY-MM-DD`. Endpoints: `POST/DELETE /events/:eventKey/interest`, `GET /events/:eventKey/interest/me`, public `GET /events/:eventKey/interest/counts`. UI: красная кнопка с location-selector + counter «N идут». **Authed-only** — guest flow отложен.
- PR #74 — Pace groups: `LocationPaceGroup` (`locationId`, `distanceKm`, `paceSecondsPerKm`, `pacerName?`). Pace хранится integer-секунды (5:30 → 330). Admin UI в `/admin/locations/[id]`. Public display на event detail — 3 карточки по точкам с темпами `M:SS`. **EventPaceGroup для override спец-событий** отложен.

**Phase 3 — осталось:** Strava background job (BullMQ воркер), notifications (email/Telegram), avatar upload. (partner-side flow ✅ закрыт — см. §U)

## S. RSVP-flow polish (2026-05-10)

Серия итераций после первого выкатанного RSVP. Куда RSVP сел в итоге: интерактивный блок живёт на `/app` (одна точка управления), `events/[id]` стала read-only витриной, на главной для authed заголовок + компактная панель «ты идёшь», большая article-карточка остаётся только гостям.

- PR #76 — добавили MyUpcomingRsvps + CancelRsvpButton на `/app`. Откатилось в #77.
- PR #77 — RSVP перенесён с `events/[id]` на `/app`. Новый read-only `EventLocationsDisplay` рендерит ту же сетку карточек + pace groups без submit/cancel. `getNextEventRsvp` дозагружает `GET /events/:id`, чтобы привязать `paceGroups` к локациям (materialized-payload их не несёт). Кнопки «Подключить Strava» и «Карта маршрутов» на detail выровнены 2-col grid'ом. `MyUpcomingRsvps` и `CancelRsvpButton` удалены.
- PR #78 — финальная полировка:
  - `NextEvent`, authed: убран `<article>` (date column + venues list + чёрный CTA), осталось только заголовок + compact `EventRsvp`. Гостевой view не тронут + mobile-only «Войти в клуб» под article'ом.
  - `PersonalDashboard`: standalone «Маршрут и точка старта» из шапки удалён, встроен в красную «ЗАВТРА»-ячейку — на месте строки с одним venue (три точки старта делают единственный адрес неактуальным).
  - `events/[id]`: «Подключить Strava» удалён; «Карта маршрутов» сжата до compact outline (h-10, content-width); guest на mobile получает «Войти в клуб» возле локаций (скрыт на desktop).
  - Угловой текст карточек локаций (full + compact + read-only display): красный, с user-aware формулировкой — `ты идёшь` / `ты и ещё N идут` / `N идут` / `будь первым`.

## U. Partner-side flow — login + verify-only dashboard (2026-05-15)

Реализован партнёрский кабинет — отдельная зона на `/partner` для пользователей с ролью `partner`.

- Новая модель `PartnerMember` (many-to-many `Partner ↔ User`) — миграция `20260515120000_add_partner_members`. У одного партнёра может быть несколько членов команды; ролей внутри пока нет.
- `PartnerMembersService` (admin-side: list/add-by-email/remove) + админ-эндпойнты `GET/POST /admin/partners/:id/members` и `DELETE .../:memberId`. `addByEmail` делает find-or-create юзера (`UsersService.findOrCreatePending`) → grants role `partner` → upsert PartnerMember. Идемпотентно.
- `PartnerRedemptionsController` (`@Roles(ROLE_PARTNER)`): `GET /partner/memberships` для UI и `POST /partner/redemptions/verify/:code?partnerId=…` для погашения. Доступ скоупится через PartnerMember; чужой код возвращает 404 (намеренно — не палим существование). Использует существующий `RedemptionsService.markUsedByCode`.
- Web: `/admin/partners/[id]` получил секцию «Команда» с list + add by email + remove (server actions). `/partner` layout требует роль `partner`, страница рендерит верификационную форму с тремя состояниями (no-membership / single / multi-partner switcher). После magic-link логина partner-роль редиректится на `/partner` вместо `/app` (`auth/verify-client.tsx` + сервер-страницы `/auth` и `/auth/verify`).
- Seed: `SEED_PARTNER_EMAIL` (опц.) — создаёт партнёр-юзера в `pending` и привязывает к `PARTNERS[0]` (monkey-grinder) как `partner-member`. Для прода — через админку.

**Что НЕ вошло** (явно): роли внутри команды, история погашений в UI, partner cancel, уведомления, статистика. Тесты для verify-flow тоже отложены — в репо нет тест-инфраструктуры (`pnpm test` = noop), вводить её — отдельный трек.

## T. RSVP encoding fix + home pace groups + admin polish (2026-05-13)

Постдоставочные правки и закрытие админ-эпика.

- PR #80 — `fix(web): single-encode eventKey on /interest fetches`. На `/events/rule:UUID:DATE` все локации стояли в «будь первым» даже после успешного RSVP с `/app`. Причина: Next 14 App Router отдаёт `params.id` уже percent-encoded (`:` → `%3A`), `getMyInterest` / `getInterestCounts` ещё раз `encodeURIComponent`-или → `%253A` → API regex не матчит → 404. Тот же decode-then-encode паттерн, что у `getPublicEvent`, добавлен в interest-хелперы и interest-actions (защитно).
- PR #81 — `fix(home): show pace groups in /'s authed RSVP panel`. После #78 на `/` для authed остался только RSVP-блок без большой article-карточки → темпы нигде не видны. Переключил `EventRsvp` на `variant="full"` на главной — теперь home и `/app` визуально совпадают по разметке точек старта.
- PR #82 — `feat(admin): redemptions UI + dashboard fix + mobile-scrollable tables`. Три закрытия одним PR:
  - `/admin` дашборд: 04 События / 05 Расписание / 06 Attendances висели как `ComingSoonCard` хотя страницы давно работают; не было карточек на Users / Points. Перевёл всё в `DashboardCard`, добавил 07 Пользователи / 08 Баллы / 09 Обмены.
  - Новый `/admin/redemptions` — список с фильтрами status/partnerId/code + verify-форма (поле для 6-char кода) + `/admin/redemptions/[id]/cancel` страница с reason textarea. Backend дополнен `GET /admin/redemptions?…` (50 на страницу, cap 200), включающим minimal user info.
  - Все 8 admin-таблиц обёрнуты в `overflow-x-auto` + `min-w-[640..820px]` — на узких экранах скролл по горизонтали вместо обрезки/растягивания viewport.

## Epic 0. Foundation

Цель:

- поднять монорепозиторий и основу инфраструктуры

Задачи:

- инициализировать `pnpm workspace` и `turborepo`
- создать `apps/web`, `apps/api`, `packages/ui`, `packages/types`, `packages/config`
- настроить TypeScript, ESLint, Prettier
- добавить Docker Compose для local dev
- подключить PostgreSQL и Redis локально
- настроить CI
- завести `.env.example`

Definition of Done:

- проект запускается локально;
- `web` и `api` билдятся;
- линт и typecheck проходят;
- локальная БД поднимается командой из README.

## Epic 1. Auth and Profiles

Цель:

- пользователь может зарегистрироваться и войти в платформу

Задачи:

- реализовать auth flow
- создать таблицы `users`, `profiles`, `roles`, `sessions`
- сделать guards и RBAC
- реализовать `/me`
- реализовать формы входа / регистрации

Definition of Done:

- пользователь может войти;
- после входа создается профиль;
- protected routes работают;
- роли применяются корректно.

## Epic 2. Events and Registrations

Цель:

- runner может видеть события и записываться

Задачи:

- реализовать CRUD событий в admin
- вывести список и карточку события в web
- добавить регистрацию на событие
- показать мои записи в кабинете

Definition of Done:

- админ создает событие;
- пользователь видит событие на сайте;
- регистрация сохраняется в БД;
- повторная запись запрещена.

## Epic 3. Check-in

Цель:

- пользователь может подтвердить участие на событии

Задачи:

- реализовать генерацию короткоживущего QR token
- реализовать экран event manager
- реализовать endpoint scan
- создать `checkins`
- сделать confirm/reject поток

Definition of Done:

- check-in можно создать сканированием QR;
- токен истекает;
- повторный check-in блокируется;
- event manager видит список check-ins.

## Epic 4. Points Engine

Цель:

- система начисляет и списывает баллы корректно и аудируемо

Задачи:

- реализовать `point_accounts`, `point_transactions`, `point_rules`
- welcome bonus
- first run bonus
- event attendance points
- ручные корректировки
- история транзакций и баланс

Definition of Done:

- все операции идут через ledger;
- дубли по idempotency не проходят;
- баланс считается корректно;
- админ видит журнал.

## Epic 5. Rewards and Partners

Цель:

- runner может обменять баллы на предложения партнеров

Задачи:

- реализовать сущности partners и rewards
- сделать каталог rewards
- сделать redemption flow
- генерировать код / QR
- реализовать partner verification

Definition of Done:

- reward можно активировать;
- при активации происходит списание;
- partner может проверить redemption;
- повторное использование заблокировано.

## Epic 6. Admin Panel

Цель:

- операционная команда может управлять платформой без разработчика

Задачи:

- dashboard админки
- управление пользователями
- управление событиями
- управление rewards и партнерами
- журнал баллов
- audit logs

Definition of Done:

- основные операционные сценарии закрыты;
- ручные корректировки доступны;
- критичные действия логируются.

## Epic 7. Marketing Site

Цель:

- публичная часть объясняет проект и конвертит в регистрацию

Задачи:

- главная
- как это работает
- события
- партнеры
- about
- faq
- базовое SEO

Definition of Done:

- страницы адаптивны;
- контент легко редактируется;
- CTA ведут в signup / events.

## Epic 8. Notifications and Analytics

Цель:

- пользователи получают сервисные сообщения, команда видит метрики

Задачи:

- email notifications
- event reminders
- reward redemption notifications
- PostHog events
- Yandex Metrica
- admin summary widgets

Definition of Done:

- ключевые уведомления отправляются;
- основные funnel events собираются;
- есть базовая продуктовая аналитика.

## 3. Рекомендуемая последовательность

1. Epic 0
2. Epic 1
3. Epic 2
4. Epic 3
5. Epic 4
6. Epic 5
7. Epic 6
8. Epic 7
9. Epic 8

`Epic 7` можно частично вести параллельно после завершения `Epic 1`.

## 4. Sprint slicing

### Sprint 1

- Epic 0
- начало Epic 1

### Sprint 2

- завершение Epic 1
- Epic 2

### Sprint 3

- Epic 3
- начало Epic 4

### Sprint 4

- завершение Epic 4
- Epic 5

### Sprint 5

- Epic 6
- Epic 7

### Sprint 6

- Epic 8
- стабилизация
- bugfix
- pre-launch hardening

## 5. Testing backlog

- unit tests для points engine
- integration tests для redemption
- e2e auth flow
- e2e event registration flow
- e2e check-in flow
- e2e reward redemption flow
- smoke tests для production deploy

## 6. Non-functional backlog

- rate limits
- audit logging
- backup policy
- health checks
- structured logs
- observability dashboards
- feature flags

## 7. Приоритеты, которые нельзя отложить

- points engine ledger model
- RBAC
- idempotency
- audit logs
- backup and restore
- secure auth flow
