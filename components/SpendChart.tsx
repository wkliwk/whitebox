"use client";

import { getAgentColor } from "@/lib/agents";
import type { DailyCostSnapshot } from "@/lib/redis";

interface Props {
  snapshots: DailyCostSnapshot[];
}

/** totalSpend and byAgent values are in USD cents */
function formatCentsDisplay(cents: number): string {
  const usd = cents / 100;
  if (usd >= 1) return `$${usd.toFixed(2)}`;
  if (usd >= 0.01) return `$${usd.toFixed(3)}`;
  return `<$0.001`;
}

/** Build last-14-days date array (oldest → newest) */
function last14Days(): string[] {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    days.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  }
  return days;
}

function shortLabel(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const d = new Date(dateStr + "T12:00:00Z");
  if (dateStr === today) return "Today";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function SpendChart({ snapshots }: Props) {
  const days = last14Days();
  const snapshotMap = new Map(snapshots.map(s => [s.date, s]));

  // Collect all agent types seen across all snapshots
  const agentSet = new Set<string>();
  for (const s of snapshots) {
    for (const agent of Object.keys(s.byAgent)) {
      agentSet.add(agent);
    }
  }
  const agents = Array.from(agentSet);

  // Build per-day totals
  const dayData = days.map(date => {
    const snap = snapshotMap.get(date);
    const total = snap?.totalSpend ?? 0;
    const byAgent = snap?.byAgent ?? {};
    return { date, total, byAgent };
  });

  const maxSpend = Math.max(...dayData.map(d => d.total), 0.001);

  if (snapshots.length === 0) {
    return (
      <div className="rounded-xl border border-[#222] bg-[#161616] p-5">
        <div className="text-[10px] uppercase tracking-widest text-[#888] font-medium mb-4">
          Daily Spend — Last 14 Days
        </div>
        <div className="text-xs text-[#555] text-center py-8">No cost history yet</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#222] bg-[#161616] p-5">
      <div className="text-[10px] uppercase tracking-widest text-[#888] font-medium mb-4">
        Daily Spend — Last 14 Days
      </div>

      {/* Chart */}
      <div className="flex items-end gap-1" style={{ height: 80 }}>
        {dayData.map(({ date, total, byAgent }) => {
          const barH = Math.max(2, Math.round((total / maxSpend) * 72));
          const hasData = total > 0;
          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-1 group relative">
              {/* Tooltip */}
              {hasData && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                  <div className="rounded bg-[#2a2a2a] border border-[#333] px-2 py-1.5 text-[10px] text-[#ccc] whitespace-nowrap shadow-lg">
                    <div className="font-medium mb-0.5">{shortLabel(date)}</div>
                    <div className="text-[#aaa]">{formatCentsDisplay(total)}</div>
                    {agents.length > 1 && Object.entries(byAgent).map(([agent, spend]) => (
                      <div key={agent} className="flex items-center gap-1 text-[#888]">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: getAgentColor(agent) }} />
                        <span className="capitalize">{agent}</span>
                        <span className="ml-auto pl-2">{formatCentsDisplay(spend as number)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#333]" />
                </div>
              )}

              {/* Stacked bar */}
              <div
                className="w-full flex flex-col-reverse rounded-sm overflow-hidden transition-opacity"
                style={{ height: barH, background: hasData ? undefined : "#1e1e1e" }}
              >
                {hasData && agents.length > 0 ? (
                  agents.map(agent => {
                    const agentSpend = (byAgent[agent] as number | undefined) ?? 0;
                    const segH = total > 0 ? (agentSpend / total) * 100 : 0;
                    if (segH === 0) return null;
                    return (
                      <div
                        key={agent}
                        style={{ height: `${segH}%`, background: getAgentColor(agent), opacity: 0.75 }}
                      />
                    );
                  })
                ) : hasData ? (
                  <div className="w-full h-full" style={{ background: "#4a4a4a", opacity: 0.75 }} />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels — show every 3rd day */}
      <div className="flex items-start gap-1 mt-1">
        {dayData.map(({ date }, i) => (
          <div key={date} className="flex-1 text-center">
            {(i % 3 === 0 || i === dayData.length - 1) && (
              <span className="text-[9px] text-[#444]">
                {shortLabel(date) === "Today" ? "Today" : new Date(date + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Agent legend */}
      {agents.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-[#1e1e1e]">
          {agents.map(agent => (
            <div key={agent} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: getAgentColor(agent) }} />
              <span className="text-[10px] text-[#666] capitalize">{agent}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
