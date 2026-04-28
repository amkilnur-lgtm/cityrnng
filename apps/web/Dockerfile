# syntax=docker/dockerfile:1.7
#
# Multi-stage build for @cityrnng/web (Next.js 14 standalone).
# Final image is ~120MB: alpine + .next/standalone + .next/static + public.
#
# Build from the repo root:
#   docker build -f apps/web/Dockerfile \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.cityrnng.ru/api/v1 \
#     -t cityrnng-web:local .

# === 1. deps ===
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /repo

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/api/prisma apps/api/prisma
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter @cityrnng/web...

# === 2. builder — Next build → .next/standalone ===
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/web/node_modules ./apps/web/node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web ./apps/web

# `NEXT_PUBLIC_*` is inlined at build time. Defaulting to localhost makes
# `docker build` work without args; pass --build-arg for staging/prod.
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter @cityrnng/web build

# === 3. runtime — minimal standalone server ===
FROM node:20-alpine AS runtime
RUN apk add --no-cache libc6-compat tini
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

RUN addgroup -g 1001 -S app && adduser -u 1001 -S app -G app

# Standalone bundles only the files needed at runtime — no node_modules
# tree, no source.
COPY --from=builder --chown=app:app /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=app:app /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=app:app /repo/apps/web/public ./apps/web/public

USER app
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/web/server.js"]
