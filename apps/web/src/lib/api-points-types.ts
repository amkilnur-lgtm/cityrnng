/**
 * Pure types + helpers for points data — safe to import from client components.
 * Server-only fetchers live in lib/api-points.ts (which uses next/headers).
 */

export type PointsBalance = { balance: number };

export type PointsTxnDirection = "credit" | "debit";

export type PointsTxn = {
  id: string;
  direction: PointsTxnDirection;
  amount: number;
  balanceAfter: number;
  reasonType: string;
  reasonRef: string | null;
  comment: string | null;
  createdAt: string;
};

export type PointsHistory = {
  rows: PointsTxn[];
  nextCursor: string | null;
};

const REASON_LABELS: Record<string, string> = {
  signup_bonus: "Приветственный бонус",
  event_attendance_first: "Первая пробежка",
  event_attendance_regular: "Пробежка",
  event_attendance_special: "Спецсобытие",
  event_attendance_reversal: "Отмена начисления",
  manual_adjustment: "Ручная корректировка",
  reward_redemption: "Списание · обмен на reward",
  reversal: "Возврат",
};

export function reasonLabel(reasonType: string): string {
  return REASON_LABELS[reasonType] ?? reasonType;
}
