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
});
