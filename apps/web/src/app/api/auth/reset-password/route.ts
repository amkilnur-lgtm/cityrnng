import { proxyAuthAndSetSession } from "@/lib/auth-proxy";

/** Proxy POST /auth/reset-password — set new password, sets session cookies. */
export async function POST(req: Request) {
  return proxyAuthAndSetSession(req, "/auth/reset-password");
}
