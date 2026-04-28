"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

type ActionResult =
  | { ok: true; balance: number }
  | { ok: false; message: string };

const ERROR_MESSAGES: Record<string, string> = {
  POINTS_ACCOUNT_BLOCKED: "Аккаунт пользователя заблокирован.",
};

function authHeaders(): HeadersInit | null {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function adjustPointsAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена. Войди как админ." };

  const userId = String(formData.get("userId") ?? "").trim();
  const direction = String(formData.get("direction") ?? "credit") as
    | "credit"
    | "debit";
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim();

  if (!userId) return { ok: false, message: "User ID обязателен." };
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < 1) {
    return { ok: false, message: "Сумма должна быть целым числом ≥ 1." };
  }
  if (!comment) return { ok: false, message: "Комментарий обязателен — это попадает в аудит." };

  try {
    const res = await fetch(`${API_BASE_URL}/admin/points/adjust`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        userId,
        direction,
        amount,
        comment,
        idempotencyKey: randomUUID(),
      }),
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as {
        message?: string | string[];
        code?: string;
      };
      const code = payload.code ?? "";
      const msg = Array.isArray(payload.message)
        ? payload.message.join("; ")
        : payload.message;
      return {
        ok: false,
        message:
          ERROR_MESSAGES[code] ?? msg ?? code ?? `HTTP ${res.status}`,
      };
    }
    const data = (await res.json()) as { balanceAfter: number };
    revalidatePath("/admin/points");
    revalidatePath("/admin/users");
    return { ok: true, balance: data.balanceAfter };
  } catch {
    return { ok: false, message: "API недоступен." };
  }
}
