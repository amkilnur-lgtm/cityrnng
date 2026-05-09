import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
  // Capture IP, request headers — needed to attach user context to errors.
  sendDefaultPii: true,
  // Attach local variable values to server-side stack frames.
  includeLocalVariables: true,
  enableLogs: true,
});
