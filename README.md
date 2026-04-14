# CITYRNNG

Monorepo for the CITYRNNG platform.

## Stack

- pnpm workspaces
- Turborepo
- Next.js
- NestJS
- PostgreSQL
- Redis

## Workspaces

- apps/web
- apps/api
- packages/ui
- packages/types
- packages/config

## Scripts

- `pnpm install`
- `pnpm -r build`
- `pnpm -r lint`
- `pnpm -r test`
- `pnpm -r typecheck`

## Local dev

Copy `.env.example` to `.env` **at the repo root** — the API loads env from the monorepo-root `.env` regardless of where the script is invoked from. The API validates env on boot (`DATABASE_URL` is required).

```
cp .env.example .env
```

Start infrastructure:

```
docker compose up -d postgres redis
```

Apply database migrations (required on first run and after schema changes):

```
pnpm --filter @cityrnng/api prisma:migrate:dev
```

Run apps:

- API (NestJS, http://localhost:4000): `pnpm --filter @cityrnng/api dev`
  - Health: `GET http://localhost:4000/api/v1/health` → `{"status":"ok"}`
  - DB health: `GET http://localhost:4000/api/v1/health/db` → `{"status":"ok","db":"ok"}` (503 if DB unreachable)
- Web (Next.js, http://localhost:3000): `pnpm --filter @cityrnng/web dev`

Build everything: `pnpm -r build`. Typecheck: `pnpm -r typecheck`.

### Prisma scripts (`apps/api`)

All Prisma CLI scripts preload the monorepo-root `.env` via `dotenv-cli`, so no manual `export DATABASE_URL=...` is ever needed. Run them from the repo root or from `apps/api` — both work.

- `pnpm --filter @cityrnng/api prisma:generate` — regenerate client (no DB needed)
- `pnpm --filter @cityrnng/api prisma:validate` — validate `schema.prisma`
- `pnpm --filter @cityrnng/api prisma:migrate:dev` — create & apply migration in dev
- `pnpm --filter @cityrnng/api prisma:migrate:deploy` — apply pending migrations (staging/prod)
- `pnpm --filter @cityrnng/api prisma:migrate:reset` — drop and re-apply all migrations (dev only)
- `pnpm --filter @cityrnng/api prisma:studio` — open Prisma Studio
