import { formatCents } from "@/lib/utils";
import type { CostReport } from "@/lib/costs";

export function CostBreakdown({ report }: { report: CostReport | null }) {
  if (!report) {
    return (
      <div>
        <div className="text-[10px] uppercase tracking-widest text-[#444] font-medium mb-3">Cost Breakdown</div>
        <div className="text-xs text-[#444] py-4 text-center">No cost data — costs.json not found</div>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((report.mtdSpend / report.budget) * 100));
  const barColor = pct >= 90 ? "#ef4444" : pct >= 70 ? "#eab308" : "#22c55e";

  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-[#444] font-medium mb-3">Cost Breakdown</div>
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-[#e8e8e8] font-medium">{formatCents(report.mtdSpend)} / {formatCents(report.budget)}</span>
          <span className="text-[#555]">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#2a2a2a" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
        </div>
      </div>
      {report.byAgent && (
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-widest text-[#444] font-medium mb-2">By Agent</div>
          {Object.entries(report.byAgent).map(([agent, cents]) => (
            <div key={agent} className="flex justify-between text-xs">
              <span className="text-[#666] capitalize">{agent}</span>
              <span className="text-[#ccc]">{formatCents(cents as number)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
