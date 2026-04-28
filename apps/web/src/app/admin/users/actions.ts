"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

type ActionResult = { ok: true } | { ok: false; message: string };

const ERROR_MESSAGES: Record<string, string> = {
  USER_NOT_FOUND: "Пользователь не найден.",
  ROLE_NOT_FOUND: "Роль не найдена.",
  CANNOT_REVOKE_RUNNER: "Роль runner у каждого — снять нельзя.",
  CANNOT_DEMOTE_SELF: "Нельзя снять admin у себя.",
};

function authHeaders(): HeadersInit | null {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

async function callRoleApi(
  method: "POST" | "DELETE",
  userId: string,
  roleCode: string,
): Promise<ActionResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена. Войди как админ." };
  try {
    const res = await fetch(
      `${API_BASE_URL}/admin/users/${userId}/roles/${roleCode}`,
      { method, headers },
    );
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as {
        message?: string;
        code?: string;
      };
      const code = payload.code ?? "";
      return {
        ok: false,
        message:
          ERROR_MESSAGES[code] ?? payload.message ?? code ?? `HTTP ${res.status}`,
      };
    }
    revalidatePath("/admin/users");
    return { ok: true };
  } catch {
    return { ok: false, message: "API недоступен." };
  }
}

export async function grantRoleAction(
  userId: string,
  roleCode: string,
): Promise<ActionResult> {
  return callRoleApi("POST", userId, roleCode);
}

export async function revokeRoleAction(
  userId: string,
  roleCode: string,
): Promise<ActionResult> {
  return callRoleApi("DELETE", userId, roleCode);
}
