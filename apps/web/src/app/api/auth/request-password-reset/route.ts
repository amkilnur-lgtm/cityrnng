import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api-config";

/**
 * Proxy POST /auth/request-password-reset. Delivery is email; the response is
 * intentionally the same for known and unknown addresses (no enumeration).
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const res = await fetch(`${API_BASE_URL}/auth/request-password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await res.json().catch(() => ({}));
  return NextResponse.json(payload, { status: res.status });
}
