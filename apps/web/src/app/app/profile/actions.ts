"use server";

import { revalidatePath } from "next/cache";
import { disconnectStrava, getStravaAuthorizeUrl } from "@/lib/api-strava";

export async function startStravaConnect(): Promise<
  { ok: true; url: string } | { ok: false; message: string }
> {
  const url = await getStravaAuthorizeUrl();
  if (!url) {
    return { ok: false, message: "Не получилось начать подключение Strava." };
  }
  return { ok: true, url };
}

export async function disconnectStravaAction(): Promise<{ ok: boolean }> {
  const ok = await disconnectStrava();
  if (ok) revalidatePath("/app/profile");
  return { ok };
}
