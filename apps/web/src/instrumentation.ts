/**
 * Next.js instrumentation hook. Runs once per Node/Edge runtime instance
 * before the first request. We use it to bootstrap Sentry server-side.
 */
export async function register() {
  if (!process.env.SENTRY_DSN) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

type NextRequestInfo = {
  path: string;
  method: string;
  headers: Record<string, string | string[] | undefined>;
};

type NextErrorContext = {
  routerKind: string;
  routePath: string;
  routeType: string;
};

export async function onRequestError(
  err: unknown,
  request: NextRequestInfo,
  errorContext: NextErrorContext,
) {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, request, errorContext);
}
