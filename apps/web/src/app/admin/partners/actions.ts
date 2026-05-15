"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

type ActionResult = { ok: true } | { ok: false; message: string };

function authHeaders(): HeadersInit | null {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function parseBody(form: FormData) {
  return {
    slug: String(form.get("slug") ?? "").trim(),
    name: String(form.get("name") ?? "").trim(),
    description: form.get("description")
      ? String(form.get("description")).trim()
      : undefined,
    contactEmail: form.get("contactEmail")
      ? String(form.get("contactEmail")).trim()
      : undefined,
    status: (form.get("status") ?? "active") as "active" | "archived",
  };
}

export async function createPartnerAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена." };
  const body = parseBody(formData);
  if (!body.slug || !body.name) {
    return { ok: false, message: "Slug и имя обязательны." };
  }
  try {
    const res = await fetch(`${API_BASE_URL}/admin/partners`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const p = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
      return { ok: false, message: p.message ?? p.code ?? `HTTP ${res.status}` };
    }
    revalidatePath("/admin/partners");
  } catch {
    return { ok: false, message: "API недоступен." };
  }
  redirect("/admin/partners");
}

export async function updatePartnerAction(
  id: string,
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена." };
  const body = parseBody(formData);
  try {
    const res = await fetch(`${API_BASE_URL}/admin/partners/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const p = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
      return { ok: false, message: p.message ?? p.code ?? `HTTP ${res.status}` };
    }
    revalidatePath("/admin/partners");
    revalidatePath(`/admin/partners/${id}`);
  } catch {
    return { ok: false, message: "API недоступен." };
  }
  redirect("/admin/partners");
}

// -- Partner team (members) --

type MemberActionResult = { ok: true } | { ok: false; message: string };

export async function addPartnerMemberAction(
  partnerId: string,
  _prev: MemberActionResult | undefined,
  formData: FormData,
): Promise<MemberActionResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена." };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { ok: false, message: "Email обязателен." };

  try {
    const res = await fetch(
      `${API_BASE_URL}/admin/partners/${partnerId}/members`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ email }),
      },
    );
    if (!res.ok) {
      const p = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
      return { ok: false, message: p.message ?? p.code ?? `HTTP ${res.status}` };
    }
    revalidatePath(`/admin/partners/${partnerId}`);
    return { ok: true };
  } catch {
    return { ok: false, message: "API недоступен." };
  }
}

export async function removePartnerMemberAction(
  partnerId: string,
  memberId: string,
): Promise<MemberActionResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, message: "Нет access-токена." };
  try {
    const res = await fetch(
      `${API_BASE_URL}/admin/partners/${partnerId}/members/${memberId}`,
      { method: "DELETE", headers },
    );
    if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };
    revalidatePath(`/admin/partners/${partnerId}`);
    return { ok: true };
  } catch {
    return { ok: false, message: "API недоступен." };
  }
}
