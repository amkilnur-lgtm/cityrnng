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
| 6. Admin Panel | 🔄 | UI собран в `apps/web/src/app/admin/`: ✅ CRUD для locations, partners, rewards, events, recurrence-rules. Stub-страницы (нужно дописать функционал): attendances, points-adjust, users. Backend для всех CRUD-секций готов (см. эпики 2/4/5) |
| 7. Marketing Site | ✅ | Главная (guest+authed), `/auth`, `/events`, `/events/[id]`, `/how-it-works`, `/about`, `/faq`, `/partners`, `/districts` (с Я.Картами), `/journal` + `/journal/[id]`, `/shop`, `/terms`+`/privacy`+`/agreement` (stubs). Дев-toggle `[GUEST\|AUTHED]` для проверки authed-видов без API. C3 design system (Manrope/Space Grotesk/JetBrains Mono + tokens) |
| 8. Notifications & Analytics | 🔄 | Email-канал для magic-link подключен ✅ (2026-05-06) — прод-логин разблокирован. Пока нет: транзакционные письма для других сценариев (reward redemption, event reminders), аналитика |

## Q. Frontend-only stage map (актуально на 2026-05-08)

UI и backend сошлись почти всюду. Что ещё в режиме «фронт ждёт API» или «фронт-stub без логики»:

- `/shop` + `/shop/[slug]` + `/app/rewards` — backend готов, фронт всё ещё читает моки. Нужен switch на API + seed-данные `partners/rewards/redemptions` в `prisma/seed.ts`
- Admin stubs без бизнес-логики: `/admin/attendances`, `/admin/points`, `/admin/users` — страницы есть, нужны действия (approve/reject attendance, manual points adjust UI, user role toggle)
- Публичная detail-страница для materialized recurrence-occurrences (`/events/rule:UUID:DATE`)

✅ Закрыто (было в этом списке раньше):
- ~~Edit profile UI~~ — `PATCH /me` + форма работают
- ~~Admin panel целиком~~ — locations/partners/rewards/events/recurrence CRUD собран
- ~~Recurrence rules admin~~ — собран в `/admin/recurrence/`
- ~~Email-доставка magic-link~~ — канал подключен 2026-05-06, прод-логин разблокирован

Дополнительно влито: идемпотентный Prisma seed для ролей `runner/admin/partner` + опциональное повышение known-email в admin (`SEED_ADMIN_EMAIL`). Это prerequisite для admin-protected flows, не самостоятельный эпик.

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
