"use client";

import { useEffect, useState } from "react";
import type { Session } from "@/app/api/sessions/route";

function cwdLabel(cwd: string | null, sessionId: string | null): string {
  if (!cwd) return "unknown";
  const parts = cwd.replace(/\/+$/, "").split("/");
  const last2 = parts.slice(-2).join("/");
  // If just home dir, show session ID hint instead
  if (parts.length <= 2 && sessionId) return `session ${sessionId.slice(0, 8)}`;
  if (parts.length <= 2) return "~";
  return last2;
}

function elapsedLabel(elapsed: string): string {
  // elapsed is like "8:26.14" (min:sec) or "36:10.63" — show as-is
  return elapsed;
}

export function LiveSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await fetch("/api/sessions", { cache: "no-store" });
      const data = await res.json();
      setSessions(data.sessions ?? []);
      setUpdatedAt(data.updatedAt ?? "");
    } catch { /* silent */ }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] uppercase tracking-widest text-[#444] font-medium">
          Live Sessions
          {sessions.length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-[10px] bg-[#3b82f622] text-[#3b82f6] px-1.5 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] inline-block animate-pulse" />
              {sessions.length} running
            </span>
          )}
        </div>
        {updatedAt && (
          <span className="text-[10px] text-[#333]">live</span>
        )}
      </div>

      {loading ? (
        <div className="text-xs text-[#444] py-4">Detecting sessions…</div>
      ) : sessions.length === 0 ? (
        <div className="text-xs text-[#444] py-4 text-center">No active Claude sessions</div>
      ) : (
        <div className="space-y-0">
          {sessions.map(s => (
            <div key={s.pid} className="flex items-center gap-3 py-2.5 border-b border-[#1e1e1e]">
              {/* Live dot */}
              <span className="relative flex shrink-0">
                <span className="absolute inline-flex w-2 h-2 rounded-full bg-[#3b82f6] opacity-75 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-[#3b82f6]" />
              </span>

              {/* CWD / context */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[#e8e8e8] font-medium truncate">
                  {cwdLabel(s.cwd, s.sessionId)}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-[10px] text-[#444]">PID {s.pid}</span>
                  {s.flags.map(f => (
                    <span key={f} className="text-[10px] text-[#555] bg-[#222] px-1.5 py-0.5 rounded">
                      {f}
                    </span>
                  ))}
                  {s.sessionId && (
                    <span className="text-[10px] text-[#555] font-mono truncate max-w-[120px]">
                      {s.sessionId.slice(0, 8)}…
                    </span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="text-right shrink-0">
                <div className="text-xs text-[#ccc]">{s.cpu}% CPU</div>
                <div className="text-[10px] text-[#444]">{s.mem}% mem · {elapsedLabel(s.elapsed)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
