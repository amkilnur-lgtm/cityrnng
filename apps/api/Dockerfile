# syntax=docker/dockerfile:1.7
#
# Multi-stage build for @cityrnng/api (NestJS).
# Final image is ~150MB: alpine + node_modules (prod) + dist + prisma engines.
#
# Build from the repo root:
#   docker build -f apps/api/Dockerfile -t cityrnng-api:local .

# === 1. deps — install workspace deps with the lockfile pinned ===
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /repo

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
# Prisma's postinstall needs the schema present, but we only want api deps.
COPY apps/api/prisma apps/api/prisma
RUN pnpm install --frozen-lockfile --filter @cityrnng/api...

# === 2. builder — TS build + prisma client generation ===
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api ./apps/api

RUN pnpm --filter @cityrnng/api prisma generate
RUN pnpm --filter @cityrnng/api build

# Prune to production deps only — drops devDependencies from node_modules.
RUN pnpm --filter @cityrnng/api deploy --prod /prod-api

# === 3. runtime — slim image, non-root user ===
FROM node:20-alpine AS runtime
RUN apk add --no-cache libc6-compat tini
WORKDIR /app

ENV NODE_ENV=production
ENV API_PORT=4000
EXPOSE 4000

# nodemailer / express need a writable tmp; nothing else writes to disk.
RUN addgroup -g 1001 -S app && adduser -u 1001 -S app -G app

COPY --from=builder --chown=app:app /prod-api/node_modules ./node_modules
COPY --from=builder --chown=app:app /prod-api/dist ./dist
COPY --from=builder --chown=app:app /prod-api/prisma ./prisma
COPY --from=builder --chown=app:app /prod-api/package.json ./package.json

USER app
ENTRYPOINT ["/sbin/tini", "--"]
# Run pending migrations before booting — idempotent on a fresh DB or on
# re-deploys with no new migrations. `prisma` CLI is bundled in dependencies
# (not devDependencies) so it survives the prod prune.
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/main.js"]
