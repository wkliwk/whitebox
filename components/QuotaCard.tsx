"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

interface QuotaData {
  fiveHourPct: number | null;
  sevenDayPct: number | null;
  sevenDaySonnetPct: number | null;
  fiveHourResetsAt: string | null;
  sevenDayResetsAt: string | null;
  updatedAt: string | null;
  source: "live" | "statusline-cache" | "legacy-cache" | "none" | null;
}

function staleness(updatedAt: string | null, source: QuotaData["source"]): { label: string; color: string } {
  if (!updatedAt) return { label: "no data", color: "#444" };
  const ageMs = Date.now() - new Date(updatedAt).getTime();
  const ageMin = ageMs / 60000;
  if (source === "live") return { label: "live", color: "#22c55e" };
  if (ageMin < 2)  return { label: "live",       color: "#22c55e" };
  if (ageMin < 10) return { label: `${Math.floor(ageMin)}m ago`, color: "#22c55e" };
  if (ageMin < 60) return { label: `${Math.floor(ageMin)}m ago`, color: "#eab308" };
  const ageH = ageMin / 60;
  if (ageH < 24)   return { label: `${Math.floor(ageH)}h ago`,   color: "#ef4444" };
  return { label: `${Math.floor(ageH / 24)}d ago`, color: "#ef4444" };
}

function resetsIn(iso: string | null): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "resetting…";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `resets in ${h}h ${m}m`;
  return `resets in ${m}m`;
}

function PctBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1 rounded-full bg-[#2a2a2a] overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  );
}

function barColor(pct: number) {
  return pct >= 90 ? "#ef4444" : pct >= 70 ? "#eab308" : "#3b82f6";
}

function pctColor(pct: number | null) {
  if (pct === null) return "#555";
  return pct >= 90 ? "#ef4444" : pct >= 70 ? "#eab308" : "#e8e8e8";
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

  const fh = data?.fiveHourPct ?? null;
  const sd = data?.sevenDayPct ?? null;
  const sdSonnet = data?.sevenDaySonnetPct ?? null;
  const stale = staleness(data?.updatedAt ?? null, data?.source ?? null);
  const fhResets = resetsIn(data?.fiveHourResetsAt ?? null);
  const sdResets = resetsIn(data?.sevenDayResetsAt ?? null);

  return (
    <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: "#1c1c1c", border: "1px solid #2a2a2a" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "#2a2a2a" }}>
            <Zap size={13} className="text-[#666]" />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-[#555] font-medium">Quota</span>
        </div>
        <span className="text-[10px] font-medium" style={{ color: stale.color }}>{stale.label}</span>
      </div>

      {/* 5h */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-[#444]">5h</span>
          <span className="text-xl font-bold tabular-nums" style={{ color: pctColor(fh) }}>
            {fh !== null ? `${fh}%` : "—"}
          </span>
        </div>
        {fh !== null && <PctBar pct={fh} color={barColor(fh)} />}
        {fhResets && <div className="text-[10px] text-[#444]">{fhResets}</div>}
      </div>

      <div className="h-px bg-[#222]" />

      {/* 7d */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-[#444]">7d</span>
          <span className="text-xl font-bold tabular-nums" style={{ color: pctColor(sd) }}>
            {sd !== null ? `${sd}%` : "—"}
          </span>
        </div>
        {sd !== null && <PctBar pct={sd} color={barColor(sd)} />}
        {sdResets && <div className="text-[10px] text-[#444]">{sdResets}</div>}
      </div>

      {/* 7d Sonnet (when available) */}
      {sdSonnet !== null && (
        <>
          <div className="h-px bg-[#222]" />
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-[#444]">7d Sonnet</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: pctColor(sdSonnet) }}>
                {sdSonnet}%
              </span>
            </div>
            <PctBar pct={sdSonnet} color={barColor(sdSonnet)} />
          </div>
        </>
      )}
    </div>
  );
}
