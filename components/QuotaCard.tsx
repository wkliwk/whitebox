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
  if (!updatedAt) return { label: "no data", color: "#666" };
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

function resetsIn(iso: string | null): { countdown: string; datetime: string } | null {
  if (!iso) return null;
  const date = new Date(iso);
  const ms = date.getTime() - Date.now();
  if (ms <= 0) return { countdown: "resetting…", datetime: "" };
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const countdown = h > 0 ? `resets in ${h}h ${m}m` : `resets in ${m}m`;
  const datetime = date.toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: false,
  });
  return { countdown, datetime };
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

function QuotaRow({
  label, pct, resets, compact,
}: {
  label: string;
  pct: number | null;
  resets: { countdown: string; datetime: string } | null;
  compact?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      {/* Label left, value right — both vertically centered */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#777]">{label}</span>
        <span
          className={`font-bold tabular-nums ${compact ? "text-base" : "text-xl"}`}
          style={{ color: pctColor(pct) }}
        >
          {pct !== null ? `${pct}%` : "—"}
        </span>
      </div>

      {/* Bar */}
      {pct !== null && <PctBar pct={pct} color={barColor(pct)} />}

      {/* Reset info: countdown · datetime on same line */}
      {resets && (
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-[#777]">{resets.countdown}</span>
          {resets.datetime && (
            <span className="text-[#888]">· {resets.datetime}</span>
          )}
        </div>
      )}
    </div>
  );
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
      <a href="https://claude.ai/settings/usage" target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-between group">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "#2a2a2a" }}>
            <Zap size={13} className="text-[#888] group-hover:text-[#e8e8e8] transition-colors" />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-[#777] font-medium group-hover:text-[#e8e8e8] transition-colors">Quota</span>
        </div>
        <span className="text-[10px] font-medium" style={{ color: stale.color }}>{stale.label}</span>
      </a>

      {/* 5h */}
      <QuotaRow
        label="5h"
        pct={fh}
        resets={fhResets}
      />

      <div className="h-px bg-[#222]" />

      {/* 7d */}
      <QuotaRow
        label="7d"
        pct={sd}
        resets={sdResets}
      />

      {/* 7d Sonnet */}
      {sdSonnet !== null && (
        <>
          <div className="h-px bg-[#222]" />
          <QuotaRow label="7d Sonnet" pct={sdSonnet} resets={null} compact />
        </>
      )}
    </div>
  );
}
