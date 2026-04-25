"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

type ActionResult =
  | { ok: true; redemptionId: string; code: string }
  | { ok: false; message: string };

const ERROR_MESSAGES: Record<string, string> = {
  REWARD_NOT_FOUND: "Награда не найдена.",
  REWARD_NOT_AVAILABLE: "Награда недоступна.",
  REWARD_PARTNER_ARCHIVED: "Партнёр больше не активен.",
  REWARD_NOT_YET_AVAILABLE: "Награда ещё не доступна.",
  REWARD_EXPIRED: "Срок действия истёк.",
  REWARD_SOLD_OUT: "Награды закончились.",
  POINTS_INSUFFICIENT: "Не хватает баллов.",
  REWARD_CODE_GENERATION_FAILED:
    "Не удалось сгенерировать код. Попробуй ещё раз.",
};

export async function redeemRewardAction(slug: string): Promise<ActionResult> {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return { ok: false, message: "Войди, чтобы обменять." };

  const idempotencyKey = randomUUID();

  try {
    const res = await fetch(
      `${API_BASE_URL}/rewards/${encodeURIComponent(slug)}/redeem`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idempotencyKey }),
      },
    );
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as {
        message?: string;
        code?: string;
      };
      const code = payload.code ?? "";
      const friendly = ERROR_MESSAGES[code];
      return {
        ok: false,
        message:
          friendly ?? payload.message ?? code ?? `HTTP ${res.status}`,
      };
    }
    const data = (await res.json()) as { id: string; code: string };
    revalidatePath("/shop");
    revalidatePath(`/shop/${slug}`);
    revalidatePath("/app/rewards");
    return { ok: true, redemptionId: data.id, code: data.code };
  } catch {
    return { ok: false, message: "API недоступен." };
  }
}

export async function redeemAndRedirect(slug: string) {
  const result = await redeemRewardAction(slug);
  if (result.ok) {
    redirect(`/app/rewards?new=${encodeURIComponent(result.code)}`);
  }
  // Bubble error back via query string — page reads it for display.
  redirect(
    `/shop/${encodeURIComponent(slug)}?err=${encodeURIComponent(result.message)}`,
  );
}
