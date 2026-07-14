"use client";

import { useState, useTransition } from "react";
import {
  rotateScanDeviceKeyAction,
  setScanDeviceStatusAction,
  testScanDeviceAction,
} from "@/app/admin/checkin/actions";

const OK_RESULTS = new Set(["matched", "duplicate"]);

export function ScanDeviceRowActions({
  id,
  status,
}: {
  id: string;
  status: "active" | "disabled";
}) {
  const [pending, startTransition] = useTransition();
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testCode, setTestCode] = useState("");
  const [testResult, setTestResult] = useState<
    { ok: boolean; message: string } | null
  >(null);
  const [testPending, startTestTransition] = useTransition();

  function toggleStatus() {
    setError(null);
    const next = status === "active" ? "disabled" : "active";
    startTransition(async () => {
      const res = await setScanDeviceStatusAction(id, next);
      if (!res.ok) setError(res.message);
    });
  }

  function rotate() {
    if (!confirm("Перевыпустить ключ? Старый перестанет работать сразу.")) return;
    setError(null);
    setNewKey(null);
    startTransition(async () => {
      const res = await rotateScanDeviceKeyAction(id);
      if (res.ok) setNewKey(res.key);
      else setError(res.message);
    });
  }

  function runTestScan() {
    setTestResult(null);
    startTestTransition(async () => {
      const res = await testScanDeviceAction(id, testCode);
      if (res.ok) setTestResult({ ok: OK_RESULTS.has(res.result), message: res.message });
      else setTestResult({ ok: false, message: res.message });
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={toggleStatus}
          disabled={pending}
          className="border border-ink bg-paper px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink hover:bg-ink hover:text-paper disabled:opacity-50"
        >
          {status === "active" ? "выключить" : "включить"}
        </button>
        <button
          type="button"
          onClick={rotate}
          disabled={pending}
          className="border border-ink/40 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted hover:border-brand-red hover:text-brand-red disabled:opacity-50"
        >
          ключ
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <input
          type="text"
          value={testCode}
          onChange={(e) => setTestCode(e.target.value)}
          placeholder="checkin-код бегуна"
          disabled={status !== "active"}
          className="h-8 w-40 border border-ink/40 bg-paper px-2 font-mono text-[11px] outline-none c3-focus disabled:opacity-50"
        />
        <button
          type="button"
          onClick={runTestScan}
          disabled={testPending || status !== "active" || !testCode.trim()}
          className="border border-ink/40 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted hover:border-ink hover:text-ink disabled:opacity-50"
        >
          {testPending ? "проверяем…" : "тест-скан"}
        </button>
      </div>
      {testResult ? (
        <span
          className={
            "max-w-[220px] text-right text-[11px] " +
            (testResult.ok ? "text-ink" : "text-brand-red-ink")
          }
        >
          {testResult.message}
        </span>
      ) : null}
      {newKey ? (
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-red">
            новый ключ — один раз
          </span>
          <code className="select-all break-all border border-ink bg-paper px-2 py-1 text-left font-mono text-[11px] text-ink">
            {newKey}
          </code>
        </div>
      ) : null}
      {error ? (
        <span className="text-[11px] text-brand-red-ink">{error}</span>
      ) : null}
    </div>
  );
}
