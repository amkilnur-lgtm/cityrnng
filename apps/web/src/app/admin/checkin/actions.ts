"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

type KeyResult =
  | { ok: true; key: string; label?: string }
  | { ok: false; message: string };

type OkResult = { ok: true } | { ok: false; message: string };

function authHeaders(): HeadersInit | null {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function createScanDeviceAction(
  _prev: KeyResult | undefined,
  formData: FormData,
): Promise<KeyResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена. Войди как админ." };

  const locationId = String(formData.get("locationId") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  if (!locationId) return { ok: false, message: "Выбери точку." };
  if (!label) return { ok: false, message: "Укажи название сканера." };

  try {
    const res = await fetch(`${API_BASE_URL}/admin/scan-devices`, {
      method: "POST",
      headers,
      body: JSON.stringify({ locationId, label }),
    });
    if (!res.ok) {
      return { ok: false, message: `Не удалось создать (${res.status}).` };
    }
    const data = (await res.json()) as { key: string; label: string };
    revalidatePath("/admin/checkin");
    return { ok: true, key: data.key, label: data.label };
  } catch {
    return { ok: false, message: "Сеть недоступна." };
  }
}

export async function setScanDeviceStatusAction(
  id: string,
  status: "active" | "disabled",
): Promise<OkResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена." };
  try {
    const res = await fetch(`${API_BASE_URL}/admin/scan-devices/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return { ok: false, message: `Ошибка (${res.status}).` };
    revalidatePath("/admin/checkin");
    return { ok: true };
  } catch {
    return { ok: false, message: "Сеть недоступна." };
  }
}

export async function rotateScanDeviceKeyAction(
  id: string,
): Promise<KeyResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена." };
  try {
    const res = await fetch(`${API_BASE_URL}/admin/scan-devices/${id}/rotate-key`, {
      method: "POST",
      headers,
    });
    if (!res.ok) return { ok: false, message: `Ошибка (${res.status}).` };
    const data = (await res.json()) as { key: string };
    revalidatePath("/admin/checkin");
    return { ok: true, key: data.key };
  } catch {
    return { ok: false, message: "Сеть недоступна." };
  }
}
