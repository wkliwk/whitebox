"use client";

import { useEffect, useState } from "react";
import type { Session } from "@/app/api/sessions/route";

function SessionCard({ s }: { s: Session }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#222]">
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
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium truncate ${s.titled ? "text-[#e8e8e8]" : "text-[#888]"}`}>
            {s.title}
          </span>
          {s.issueNumber !== null && (
            s.issueUrl ? (
              <a
                href={s.issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-[#5b8dee] bg-[#1a2540] px-1.5 py-0.5 rounded hover:text-[#7aa3f5] transition-colors shrink-0"
              >
                #{s.issueNumber}
              </a>
            ) : (
              <span className="text-[10px] text-[#5b8dee] bg-[#1a2540] px-1.5 py-0.5 rounded shrink-0">
                #{s.issueNumber}
              </span>
            )
          )}
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
  );
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
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, []);

  const totalCpu = sessions.reduce((s, x) => s + x.cpu, 0).toFixed(1);

  // Group sessions by agentType; null agentType goes into "unknown"
  const groupMap = new Map<string, Session[]>();
  for (const s of sessions) {
    const key = s.agentType ?? "unknown";
    const existing = groupMap.get(key);
    if (existing) {
      existing.push(s);
    } else {
      groupMap.set(key, [s]);
    }
  }
  const groups = Array.from(groupMap.entries());
  const showGroupHeaders = groups.length > 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] uppercase tracking-widest text-[#888] font-medium">
          Live Sessions
          {sessions.length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-[10px] bg-[#3b82f622] text-[#3b82f6] px-1.5 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] inline-block animate-pulse" />
              {sessions.length} active · {totalCpu}% CPU
            </span>
          )}
        </div>
        {updatedAt && <span className="text-[10px] text-[#777]">live</span>}
      </div>

      {loading ? (
        <div className="text-xs text-[#888] py-4">Detecting sessions…</div>
      ) : sessions.length === 0 ? (
        <div className="text-xs text-[#888] py-4 text-center">No active Claude sessions</div>
      ) : (
        <div className="space-y-0">
          {showGroupHeaders ? (
            groups.map(([agentType, groupSessions]) => (
              <div key={agentType}>
                <div className="text-[10px] uppercase tracking-widest text-[#555] font-medium pt-3 pb-1">
                  {agentType}
                  <span className="ml-1 text-[#3a3a3a]">×{groupSessions.length}</span>
                </div>
                {groupSessions.map(s => (
                  <SessionCard key={s.pid} s={s} />
                ))}
              </div>
            ))
          ) : (
            sessions.map(s => (
              <SessionCard key={s.pid} s={s} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
