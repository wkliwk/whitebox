"use client";

import { useEffect, useRef, useState } from "react";
import { getAgentColor } from "@/lib/agents";
import type { SessionHistoryRecord } from "@/lib/redis";

function formatDuration(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function SessionHistory() {
  const [records, setRecords] = useState<SessionHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const pollingActive = useRef(true);

  async function refresh() {
    if (!pollingActive.current) return;
    try {
      const res = await fetch("/api/sessions", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setRecords((data.history ?? []) as SessionHistoryRecord[]);
    } catch { /* silent */ }
    setLoading(false);
  }

  useEffect(() => {
    pollingActive.current = true;
    refresh();
    const interval = setInterval(refresh, 30000);
    const onVisibility = () => {
      if (document.hidden) { pollingActive.current = false; }
      else { pollingActive.current = true; refresh(); }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      pollingActive.current = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter to today only
  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = records.filter(r => r.completedAt.slice(0, 10) === today);

  if (loading) return null;
  if (todayRecords.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#222] bg-[#161616] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] uppercase tracking-widest text-[#888] font-medium">
          Sessions Today
        </div>
        <div className="text-[10px] text-[#444]">{todayRecords.length} completed</div>
      </div>

      <div className="space-y-0">
        {todayRecords.map((r, i) => {
          const color = getAgentColor(r.agentType);
          const agentLabel = r.agentType.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          return (
            <div key={i} className="flex items-start gap-3 py-2.5 border-b border-[#1e1e1e] last:border-0">
              {/* Color dot */}
              <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: color }} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-medium" style={{ color }}>{agentLabel}</span>
                  {r.project && (
                    <>
                      <span className="text-[10px] text-[#444]">·</span>
                      <span className="text-[10px] text-[#555] font-mono">{r.project}</span>
                    </>
                  )}
                  <span className="text-[10px] text-[#444]">·</span>
                  <span className="text-[10px] text-[#444]">{relativeTime(r.completedAt)}</span>
                </div>
                {r.task && (
                  <p className="text-xs text-[#666] leading-relaxed truncate">
                    {r.task.length > 80 ? r.task.slice(0, 80) + "…" : r.task}
                  </p>
                )}
              </div>

              {/* Duration badge */}
              {r.durationMs > 0 && (
                <div className="flex-shrink-0 text-[10px] text-[#444] font-mono mt-0.5">
                  {formatDuration(r.durationMs)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
