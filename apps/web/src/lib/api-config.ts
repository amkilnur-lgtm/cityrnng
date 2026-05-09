/**
 * Base URL for the CITYRNNG API. Server-side code prefers
 * `API_INTERNAL_URL` (typically the docker-network hostname like
 * `http://api:4000/api/v1`) so requests don't loop out through Cloudflare
 * + Caddy on every fetch. Browser bundles only see `NEXT_PUBLIC_API_URL`
 * because non-public env vars aren't inlined client-side, so the same
 * import works in both contexts.
 */
export const API_BASE_URL =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

/** httpOnly cookie holding the JWT access token. */
export const AT_COOKIE = "cityrnng_at";
/** httpOnly cookie holding the JWT refresh token. */
export const RT_COOKIE = "cityrnng_rt";

/** Default cookie options — httpOnly, sameSite lax, path root. */
export const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};
