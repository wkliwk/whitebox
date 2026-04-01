import { getAgentColor } from "@/lib/agents";
import { formatCents } from "@/lib/utils";
import type { CostReport } from "@/lib/costs";

interface Props {
  report: CostReport | null;
}

export function AgentCostBreakdown({ report }: Props) {
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
          return (
            <div key={agent}>
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-[#ccc] capitalize">{agent}</span>
                </div>
                <div className="flex items-center gap-2 text-[#888]">
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
