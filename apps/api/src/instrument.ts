/**
 * Sentry instrumentation. MUST be imported as the very first thing in
 * main.ts so the SDK can patch Node internals before any other module
 * loads. If SENTRY_DSN is unset, init is a no-op and the SDK silently
 * drops events.
 */
import * as Sentry from "@sentry/nestjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
  });
}
