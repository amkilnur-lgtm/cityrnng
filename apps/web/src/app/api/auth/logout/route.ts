import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BASE_URL, AT_COOKIE, RT_COOKIE } from "@/lib/api-config";

export async function POST() {
  const jar = cookies();
  const refreshToken = jar.get(RT_COOKIE)?.value;

  // Revoke the session server-side first; if it fails, we still drop the
  // cookies locally so the user is logged out client-side either way.
  if (refreshToken) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });
    } catch {
      // swallow — local logout still proceeds
    }
  }

  jar.delete(AT_COOKIE);
  jar.delete(RT_COOKIE);
  return NextResponse.json({ ok: true });
}
