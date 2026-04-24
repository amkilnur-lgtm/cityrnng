/**
 * Base URL for the CITYRNNG API. Overridable via NEXT_PUBLIC_API_URL
 * for staging/prod builds. Default assumes local dev server on :4000.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

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
