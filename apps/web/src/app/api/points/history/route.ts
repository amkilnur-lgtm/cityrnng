import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

/** Proxy GET /points/history so the client can paginate without seeing the JWT. */
export async function GET(req: Request) {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { code: "AUTH_REQUIRED", message: "Not authenticated" },
      { status: 401 },
    );
  }

  const incoming = new URL(req.url);
  const target = new URL(`${API_BASE_URL}/points/history`);
  for (const [k, v] of incoming.searchParams) target.searchParams.set(k, v);

  try {
    const res = await fetch(target.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json(
      { code: "UPSTREAM_UNREACHABLE", message: "API недоступен" },
      { status: 502 },
    );
  }
}
