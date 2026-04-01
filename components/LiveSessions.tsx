"use client";

import { useEffect, useRef, useState } from "react";
import type { Session, ActiveTaskFile } from "@/app/api/sessions/route";

export function LiveSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTasks, setActiveTasks] = useState<ActiveTaskFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshError, setRefreshError] = useState(false);
  const [secondsSince, setSecondsSince] = useState(0);
  const lastFetchedAt = useRef<number>(0);
  const pollingActive = useRef(true);

  async function refresh() {
    if (!pollingActive.current) return;
    try {
      const res = await fetch("/api/sessions", { cache: "no-store" });
      if (!res.ok) throw new Error("non-2xx");
      const data = await res.json();
      setSessions(data.sessions ?? []);
      setActiveTasks(data.activeTasks ?? []);
      setRefreshError(false);
      lastFetchedAt.current = Date.now();
      setSecondsSince(0);
    } catch {
      setRefreshError(true);
    }
    setLoading(false);
  }

  // Polling: 15s interval, pauses on tab blur
  useEffect(() => {
    refresh();
    const pollId = setInterval(refresh, 15000);

    const onVisibility = () => {
      if (document.hidden) {
        pollingActive.current = false;
      } else {
        pollingActive.current = true;
        refresh(); // immediate refresh on tab focus
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(pollId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Updated Xs ago" counter — ticks every second
  useEffect(() => {
    const tickId = setInterval(() => {
      if (lastFetchedAt.current > 0) {
        setSecondsSince(Math.floor((Date.now() - lastFetchedAt.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(tickId);
  }, []);

  const totalCpu = sessions.reduce((s, x) => s + x.cpu, 0).toFixed(1);
  const agoLabel = secondsSince < 5 ? "just now" : `${secondsSince}s ago`;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-[10px] uppercase tracking-widest text-[#888] font-medium">
            Live Sessions
          </div>
          {sessions.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-[#3b82f622] text-[#3b82f6] px-1.5 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] inline-block animate-pulse" />
              {sessions.length} active · {totalCpu}% CPU
            </span>
          )}
          {/* Polling pulse indicator */}
          <span className="inline-flex items-center gap-1 text-[10px] text-[#444]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] inline-block animate-pulse" />
          </span>
        </div>
        <div className="flex items-center gap-2">
          {refreshError && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#eab30818] text-[#eab308]">
              Refresh failed
            </span>
          )}
          {!loading && lastFetchedAt.current > 0 && (
            <span className="text-[10px] text-[#555]">Updated {agoLabel}</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-xs text-[#888] py-4">Detecting sessions…</div>
      ) : sessions.length === 0 && activeTasks.filter(t => t.isStale).length === 0 ? (
        <div className="text-xs text-[#888] py-4 text-center">No active Claude sessions</div>
      ) : (
        <div className="space-y-0">
          {sessions.map(s => (
            <div key={s.pid} className="flex items-center gap-3 py-2.5 border-b border-[#222]">
              {/* Status dot — pulsing if titled (agent actively labeled it), static if inferred */}
              <span className="relative flex shrink-0">
                {s.titled && (
                  <span className="absolute inline-flex w-2 h-2 rounded-full bg-[#3b82f6] opacity-75 animate-ping" />
                )}
                <span className="relative inline-flex w-2 h-2 rounded-full"
                  style={{ background: s.titled ? "#3b82f6" : s.cpu > 5 ? "#3b82f6" : "#2a2a2a" }} />
              </span>

              {/* Title + meta */}
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-medium truncate ${s.titled ? "text-[#e8e8e8]" : "text-[#888]"}`}>
                  {s.title}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {s.project && (
                    <span className="text-[10px] text-[#777]">{s.project}</span>
                  )}
                  {s.flags.map(f => (
                    <span key={f} className="text-[10px] text-[#777] bg-[#1a1a1a] px-1 py-0.5 rounded">{f}</span>
                  ))}
                  <span className="text-[10px] text-[#3a3a3a]">PID {s.pid}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="text-right shrink-0">
                <div className="text-[10px] text-[#777]">{s.cpu}% CPU</div>
                <div className="text-[10px] text-[#777]">{s.elapsed}</div>
              </div>
            </div>
          ))}

          {/* Stale task entries — previously active agents with no recent update */}
          {activeTasks.filter(t => t.isStale).map((t, i) => (
            <div key={`stale-${i}`} className="flex items-center gap-3 py-2.5 border-b border-[#222] opacity-60">
              <span className="relative flex shrink-0 w-2 h-2">
                <span className="relative inline-flex w-2 h-2 rounded-full bg-[#eab308]" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#888] truncate">{t.label}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 bg-[#eab30818] text-[#eab308]">
                    Stale · {t.ageMinutes}m ago
                  </span>
                </div>
                {t.project && (
                  <span className="text-[10px] text-[#555]">{t.project}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
