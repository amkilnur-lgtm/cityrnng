import { proxyAuthAndSetSession } from "@/lib/auth-proxy";

/** Proxy POST /auth/register — create account with password, sets session. */
export async function POST(req: Request) {
  return proxyAuthAndSetSession(req, "/auth/register");
}
