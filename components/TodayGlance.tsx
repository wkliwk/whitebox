"use client";

import { useEffect, useRef, useState } from "react";
import type { SessionHistoryRecord } from "@/lib/redis";
import type { RecentTask } from "@/lib/github";

function formatActiveTime(ms: number): string {
  if (ms <= 0) return "—";
  const totalMins = Math.round(ms / 60000);
  if (totalMins < 60) return `${totalMins}m`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface Props {
  /** Recently closed issues (status === "done") from server — used for issues-closed-today count */
  doneTasks: RecentTask[];
}

export function TodayGlance({ doneTasks }: Props) {
  const [history, setHistory] = useState<SessionHistoryRecord[]>([]);
  const pollingActive = useRef(true);

  useEffect(() => {
    pollingActive.current = true;
    const fetchHistory = async () => {
      if (!pollingActive.current) return;
      try {
        const res = await fetch("/api/sessions", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setHistory((data.history ?? []) as SessionHistoryRecord[]);
        }
      } catch { /* silent */ }
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 30000);
    return () => { pollingActive.current = false; clearInterval(interval); };
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const todaySessions = history.filter(r => r.completedAt.slice(0, 10) === today);
  const sessionCount = todaySessions.length;
  const activeMsTotal = todaySessions.reduce((sum, r) => sum + r.durationMs, 0);

  const issuesClosedToday = doneTasks.filter(t => t.updatedAt.slice(0, 10) === today).length;

  const stat = (value: string | number, label: string) => (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium text-[#e8e8e8]">
        {value === 0 || value === "" ? "—" : value}
      </span>
      <span className="text-[10px] text-[#555]">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-6 px-4 py-3 rounded-xl border border-[#222] bg-[#161616]">
      {stat(sessionCount || "—", sessionCount === 1 ? "session today" : "sessions today")}
      <div className="w-px h-3 bg-[#2a2a2a]" />
      {stat(formatActiveTime(activeMsTotal), "active")}
      <div className="w-px h-3 bg-[#2a2a2a]" />
      {stat(issuesClosedToday || "—", issuesClosedToday === 1 ? "issue closed" : "issues closed")}
    </div>
  );
}
