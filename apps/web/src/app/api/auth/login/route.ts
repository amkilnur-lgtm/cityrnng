import { proxyAuthAndSetSession } from "@/lib/auth-proxy";

/** Proxy POST /auth/login — password login, sets session cookies. */
export async function POST(req: Request) {
  return proxyAuthAndSetSession(req, "/auth/login");
}
