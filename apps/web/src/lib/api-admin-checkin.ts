import { cookies } from "next/headers";
import { API_BASE_URL, AT_COOKIE } from "@/lib/api-config";

/**
 * Server-side admin client for the QR check-in system (scanner devices +
 * scan journal). Mirrors api-admin.ts: real admin token → real data, dev-mock
 * admin (no token) → empty fallbacks.
 */

function adminHeaders(): HeadersInit | null {
  const token = cookies().get(AT_COOKIE)?.value;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

async function fetchJson<T>(path: string): Promise<T | null> {
  const headers = adminHeaders();
  if (!headers) return null;
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store",
      headers,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type ScanDeviceStatus = "active" | "disabled";

export type AdminScanDevice = {
  id: string;
  label: string;
  status: ScanDeviceStatus;
  locationId: string;
  locationName: string;
  locationCity: string;
  lastSeenAt: string | null;
  createdAt: string;
};

export type CheckinScanResult =
  | "matched"
  | "duplicate"
  | "no_window"
  | "unknown_code"
  | "error";

export type AdminCheckinScan = {
  id: string;
  result: CheckinScanResult;
  scannedAt: string;
  receivedAt: string;
  deviceLabel: string;
  locationName: string;
  checkinCode: string;
  runner: { email: string; displayName: string | null } | null;
  eventTitle: string | null;
  eventStartsAt: string | null;
};

export async function listScanDevices(): Promise<AdminScanDevice[]> {
  return (await fetchJson<AdminScanDevice[]>("/admin/scan-devices")) ?? [];
}

export async function listCheckinScans(
  filter: { deviceId?: string } = {},
): Promise<AdminCheckinScan[]> {
  const qs = filter.deviceId ? `?deviceId=${filter.deviceId}` : "";
  return (
    (await fetchJson<AdminCheckinScan[]>(`/admin/scan-devices/scans${qs}`)) ?? []
  );
}
