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

Copy `.env.example` to `.env` at the repo root, then:

- API (NestJS, http://localhost:4000): `pnpm --filter @cityrnng/api dev`
  - Health: `GET http://localhost:4000/api/v1/health` → `{"status":"ok"}`
- Web (Next.js, http://localhost:3000): `pnpm --filter @cityrnng/web dev`

Build everything: `pnpm -r build`. Typecheck: `pnpm -r typecheck`.
