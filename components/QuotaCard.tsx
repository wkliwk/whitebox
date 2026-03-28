"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

interface QuotaData {
  fiveHourPct: number | null;
  sevenDayPct: number | null;
  fiveHourResetsAt: number | null;
  updatedAt: string | null;
}

function staleness(updatedAt: string | null): { label: string; color: string } {
  if (!updatedAt) return { label: "no data", color: "#444" };
  const ageMs = Date.now() - new Date(updatedAt).getTime();
  const ageMin = ageMs / 60000;
  if (ageMin < 2) return { label: "live", color: "#22c55e" };
  if (ageMin < 10) return { label: `${Math.floor(ageMin)}m ago`, color: "#22c55e" };
  if (ageMin < 60) return { label: `${Math.floor(ageMin)}m ago`, color: "#eab308" };
  const ageH = ageMin / 60;
  if (ageH < 24) return { label: `${Math.floor(ageH)}h ago`, color: "#ef4444" };
  return { label: `${Math.floor(ageH / 24)}d ago`, color: "#ef4444" };
}

function resetsIn(epoch: number | null): string | null {
  if (!epoch) return null;
  const ms = epoch * 1000 - Date.now();
  if (ms <= 0) return "resetting…";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `resets in ${h}h ${m}m`;
  return `resets in ${m}m`;
}

export function QuotaCard() {
  const [data, setData] = useState<QuotaData | null>(null);

  async function refresh() {
    try {
      const res = await fetch("/api/quota", { cache: "no-store" });
      const d = await res.json();
      setData(d);
    } catch { /* silent */ }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, []);

  const pct = data?.fiveHourPct ?? null;
  const stale = staleness(data?.updatedAt ?? null);
  const resets = resetsIn(data?.fiveHourResetsAt ?? null);

  // Color the value by quota level
  const valueColor = pct === null ? "#555"
    : pct >= 90 ? "#ef4444"
    : pct >= 70 ? "#eab308"
    : "#e8e8e8";

  return (
    <div className="rounded-lg p-4 flex flex-col gap-2" style={{ background: "#1c1c1c", border: "1px solid #2a2a2a" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "#2a2a2a" }}>
            <Zap size={13} className="text-[#666]" />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-[#555] font-medium">5h Quota</span>
        </div>
        <span className="text-[10px] font-medium" style={{ color: stale.color }}>{stale.label}</span>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold tabular-nums" style={{ color: valueColor }}>
          {pct !== null ? `${pct}%` : "—"}
        </span>
        {data?.sevenDayPct != null && (
          <span className="text-[10px] text-[#555] mb-1">7d: {data.sevenDayPct}%</span>
        )}
      </div>

      {/* Progress bar */}
      {pct !== null && (
        <div className="h-1 rounded-full bg-[#2a2a2a] overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(pct, 100)}%`,
              background: pct >= 90 ? "#ef4444" : pct >= 70 ? "#eab308" : "#3b82f6",
            }} />
        </div>
      )}

      <div className="text-[10px] text-[#444]">
        {resets ?? (pct === null ? "No usage data" : "Quota window")}
      </div>
    </div>
  );
}
