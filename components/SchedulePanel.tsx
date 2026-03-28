"use client";

import { useEffect, useState } from "react";
import { Clock, RefreshCw, Terminal } from "lucide-react";
import type { CronJob, LoopRun } from "@/app/api/schedule/route";

const productColors: Record<string, string> = {
  whitebox: "#8b5cf6", "money-flow": "#ec4899", formpilot: "#22c55e",
  "health-credit": "#eab308", loop: "#3b82f6",
};
function productColor(p: string) {
  for (const [k, v] of Object.entries(productColors)) if (p.toLowerCase().includes(k)) return v;
  return "#555";
}

function relTime(ts: string): string {
  try {
    const d = new Date(ts.replace(" ", "T") + ":00");
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch { return ts; }
}

export function SchedulePanel() {
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [loopRuns, setLoopRuns] = useState<LoopRun[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await fetch("/api/schedule", { cache: "no-store" });
      const data = await res.json();
      setCronJobs(data.cronJobs ?? []);
      setLoopRuns(data.loopRuns ?? []);
    } catch { /* silent */ }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <div className="text-xs text-[#888] py-8">Loading…</div>;

  return (
    <div className="space-y-10">
      {/* Cron Jobs */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={12} className="text-[#888]" />
          <div className="text-[10px] uppercase tracking-widest text-[#888] font-medium">Scheduled Jobs</div>
          <span className="text-[10px] text-[#777]">{cronJobs.length} active</span>
          <button onClick={refresh} className="ml-auto flex items-center gap-1 text-[10px] text-[#888] hover:text-[#888]">
            <RefreshCw size={10} />
          </button>
        </div>

        {cronJobs.length === 0 ? (
          <div className="text-xs text-[#888] py-4 text-center rounded-lg border border-[#2a2a2a]"
            style={{ background: "#161616" }}>No cron jobs found</div>
        ) : (
          <div className="rounded-lg border border-[#2a2a2a] overflow-hidden">
            {cronJobs.map((job, i) => (
              <div key={i}
                className={`px-4 py-3 ${i < cronJobs.length - 1 ? "border-b border-[#222]" : ""}`}
                style={{ background: "#161616" }}>
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-[10px] font-semibold text-[#3b82f6] bg-[#3b82f611] px-2 py-0.5 rounded">
                    {job.scheduleHuman}
                  </span>
                  <span className="text-[10px] text-[#777] font-mono">{job.schedule}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Terminal size={10} className="text-[#777] mt-0.5 shrink-0" />
                  <code className="text-[10px] text-[#777] leading-relaxed break-all">{job.command}</code>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loop Run History */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="text-[10px] uppercase tracking-widest text-[#888] font-medium">Loop Run History</div>
          <span className="text-[10px] text-[#777]">{loopRuns.length} entries</span>
        </div>

        {loopRuns.length === 0 ? (
          <div className="text-xs text-[#888] py-4 text-center rounded-lg border border-[#2a2a2a]"
            style={{ background: "#161616" }}>No loop log entries yet</div>
        ) : (
          <div className="space-y-0">
            {loopRuns.map((run, i) => {
              const color = productColor(run.product);
              return (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-[#222]">
                  <span className="text-[10px] text-[#888] shrink-0 w-32 mt-0.5 tabular-nums">{run.timestamp}</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: color + "22", color }}>
                    {run.product}
                  </span>
                  <span className="text-xs text-[#888] leading-relaxed flex-1">{run.action}</span>
                  <span className="text-[10px] text-[#777] shrink-0 mt-0.5">{relTime(run.timestamp)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
