import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Dev-only cookie that drives the fake-authed state. Hidden in production. */
const DEV_STATE_COOKIE = "cityrnng_dev_state";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  let body: { state?: string } = {};
  try {
    body = await req.json();
  } catch {
    // ignore — fall through to clear
  }

  const jar = cookies();
  if (body.state === "authed") {
    jar.set(DEV_STATE_COOKIE, "authed", {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  } else {
    jar.delete(DEV_STATE_COOKIE);
  }

  return NextResponse.json({ ok: true, state: body.state ?? "guest" });
}
