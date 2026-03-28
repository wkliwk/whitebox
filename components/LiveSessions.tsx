"use client";

import { useEffect, useState } from "react";
import type { Session, ActiveTask } from "@/app/api/sessions/route";

function relTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function LiveSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await fetch("/api/sessions", { cache: "no-store" });
      const data = await res.json();
      setSessions(data.sessions ?? []);
      setActiveTasks(data.activeTasks ?? []);
      setUpdatedAt(data.updatedAt ?? "");
    } catch { /* silent */ }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, []);

  const totalCpu = sessions.reduce((s, x) => s + x.cpu, 0).toFixed(1);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] uppercase tracking-widest text-[#444] font-medium">
          Live Sessions
          {sessions.length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-[10px] bg-[#3b82f622] text-[#3b82f6] px-1.5 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] inline-block animate-pulse" />
              {sessions.length} processes · {totalCpu}% CPU
            </span>
          )}
        </div>
        {updatedAt && <span className="text-[10px] text-[#333]">live</span>}
      </div>

      {loading ? (
        <div className="text-xs text-[#444] py-4">Detecting sessions…</div>
      ) : (
        <div className="space-y-4">
          {/* Active Tasks — what each session is working on */}
          {activeTasks.length > 0 && (
            <div className="space-y-0">
              {activeTasks.map((t, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#1e1e1e]">
                  <span className="relative flex shrink-0">
                    <span className="absolute inline-flex w-2 h-2 rounded-full bg-[#3b82f6] opacity-75 animate-ping" />
                    <span className="relative inline-flex w-2 h-2 rounded-full bg-[#3b82f6]" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[#e8e8e8] font-medium truncate">{t.label}</div>
                    <div className="text-[10px] text-[#555] mt-0.5">{t.project}</div>
                  </div>
                  <span className="text-[10px] text-[#444] shrink-0">{relTime(t.updatedAt)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Raw process stats */}
          {sessions.length > 0 && (
            <div className="space-y-0">
              <div className="text-[10px] text-[#333] uppercase tracking-widest mb-2">Processes</div>
              {sessions.map(s => (
                <div key={s.pid} className="flex items-center gap-2 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: s.cpu > 5 ? "#3b82f6" : "#2a2a2a" }} />
                  <span className="text-[10px] text-[#444] w-14 shrink-0">PID {s.pid}</span>
                  <div className="flex items-center gap-1 flex-1">
                    {s.flags.map(f => (
                      <span key={f} className="text-[10px] text-[#3a3a3a] bg-[#1a1a1a] px-1 py-0.5 rounded">
                        {f}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-[#555] shrink-0">{s.cpu}% · {s.elapsed}</span>
                </div>
              ))}
            </div>
          )}

          {activeTasks.length === 0 && sessions.length === 0 && (
            <div className="text-xs text-[#444] py-4 text-center">No active Claude sessions</div>
          )}
        </div>
      )}
    </div>
  );
}
