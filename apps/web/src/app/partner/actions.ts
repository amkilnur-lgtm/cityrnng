"use server";

import { cookies } from "next/headers";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

export type VerifyResult =
  | {
      ok: true;
      code: string;
      rewardTitle: string;
      partnerName: string;
      usedAt: string;
    }
  | { ok: false; message: string };

const ERROR_MESSAGES: Record<string, string> = {
  REDEMPTION_NOT_FOUND: "Код недействителен или принадлежит другому партнёру.",
  REDEMPTION_NOT_ACTIVE: "Код уже погашен или отменён.",
  REDEMPTION_EXPIRED: "Срок действия кода истёк.",
  PARTNER_NOT_LINKED: "Аккаунт не привязан к партнёру. Обратитесь к администратору.",
  PARTNER_ID_REQUIRED: "Не выбран партнёр.",
  FORBIDDEN_ROLE: "Нет доступа.",
};

export async function verifyPartnerCodeAction(
  partnerId: string | null,
  code: string,
): Promise<VerifyResult> {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return { ok: false, message: "Нет access-токена." };

  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { ok: false, message: "Введите код." };
  }

  const qs = partnerId
    ? `?partnerId=${encodeURIComponent(partnerId)}`
    : "";
  try {
    const res = await fetch(
      `${API_BASE_URL}/partner/redemptions/verify/${encodeURIComponent(normalized)}${qs}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const payload = (await res.json().catch(() => ({}))) as {
      code?: string;
      message?: string;
      reward?: { title: string; partner: { name: string } };
      usedAt?: string;
    };
    if (!res.ok) {
      const errCode = payload.code ?? "";
      return {
        ok: false,
        message: ERROR_MESSAGES[errCode] ?? payload.message ?? `HTTP ${res.status}`,
      };
    }
    return {
      ok: true,
      code: normalized,
      rewardTitle: payload.reward?.title ?? "—",
      partnerName: payload.reward?.partner?.name ?? "—",
      usedAt: payload.usedAt ?? new Date().toISOString(),
    };
  } catch {
    return { ok: false, message: "Нет связи с сервером." };
  }
}
