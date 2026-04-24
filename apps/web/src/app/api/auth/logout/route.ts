import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AT_COOKIE, RT_COOKIE } from "@/lib/api-config";

export async function POST() {
  const jar = cookies();
  jar.delete(AT_COOKIE);
  jar.delete(RT_COOKIE);
  return NextResponse.json({ ok: true });
}
