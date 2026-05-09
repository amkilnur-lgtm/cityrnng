import * as Sentry from "@sentry/nextjs";

/**
 * Next.js instrumentation hook. Runs once per Node/Edge runtime instance
 * before the first request. Boots Sentry server-side. The init in each
 * runtime config is itself a no-op when SENTRY_DSN is unset.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
