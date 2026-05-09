import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle into .next/standalone — used by the
  // production Docker image so the runtime stage doesn't need node_modules.
  output: "standalone",
};

export default withSentryConfig(nextConfig, {
  // Only run the Sentry build plugin (source-map upload, release tagging)
  // when an auth token is provided. CI and local builds without the
  // token still work — they just skip source-map upload.
  silent: !process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Hide source maps from public bundles in production.
  hideSourceMaps: true,
  // Strip the Sentry SDK's logger calls from the final bundle.
  disableLogger: true,
  // Upload a wider set of client source files so production stack traces
  // resolve cleanly to original source.
  widenClientFileUpload: true,
  // tunnelRoute disabled: the staging VPS times out on outbound
  // connections to Sentry's German ingestion IPs (34.160.x.x range),
  // which makes the proxied path 500. Browser SDK now sends directly
  // to *.sentry.io. Trade-off: ad-blockers may drop those requests in
  // production. Re-enable once VPS network egress is sorted.
});
