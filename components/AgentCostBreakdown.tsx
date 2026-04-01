"use client";

import { useEffect, useState } from "react";
import { getAgentColor } from "@/lib/agents";
import { formatCents } from "@/lib/utils";
import type { CostReport } from "@/lib/costs";
import type { DailyCostSnapshot } from "@/lib/redis";

interface Props {
  report: CostReport | null;
}

/** Inline div-based sparkline — no chart lib dependency */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-px" style={{ width: 48, height: 16 }}>
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${Math.max(2, Math.round((v / max) * 16))}px`,
            background: v > 0 ? color : "#2a2a2a",
            opacity: v > 0 ? 0.7 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

export function AgentCostBreakdown({ report }: Props) {
  const [history, setHistory] = useState<DailyCostSnapshot[]>([]);

  useEffect(() => {
    fetch("/api/costs/history", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.history) setHistory(d.history); })
      .catch(() => {});
  }, []);

  // Build last-7-days date strings (newest first → oldest last for display)
  const last7: string[] = [];
  for (let i = 6; i >= 0; i--) {
    last7.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  }
  const historyMap = new Map(history.map(s => [s.date, s]));
  const hasSparklines = history.length >= 2;

  const header = (
    <div className="text-[10px] uppercase tracking-widest text-[#888] font-medium mb-3">
      Agent Cost Breakdown
    </div>
  );

  if (!report || !report.byAgent || Object.keys(report.byAgent).length === 0) {
    return (
      <div>
        {header}
        <div className="text-xs text-[#555] py-4 text-center">No per-agent breakdown available</div>
      </div>
    );
  }

  const entries = Object.entries(report.byAgent)
    .map(([agent, cents]) => ({ agent, cents: cents as number }))
    .sort((a, b) => b.cents - a.cents);

  const total = entries.reduce((sum, e) => sum + e.cents, 0);

  return (
    <div>
      {header}
      <div className="space-y-2.5">
        {entries.map(({ agent, cents }) => {
          const pct = total > 0 ? Math.round((cents / total) * 100) : 0;
          const color = getAgentColor(agent);
          const sparkValues = last7.map(d => historyMap.get(d)?.byAgent[agent] ?? 0);
          return (
            <div key={agent}>
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-[#ccc] capitalize">{agent}</span>
                </div>
                <div className="flex items-center gap-3 text-[#888]">
                  {hasSparklines && (
                    <Sparkline values={sparkValues} color={color} />
                  )}
                  <span>{formatCents(cents)}</span>
                  <span className="text-[#555] w-7 text-right">{pct}%</span>
                </div>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "#2a2a2a" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: color, opacity: 0.8 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
