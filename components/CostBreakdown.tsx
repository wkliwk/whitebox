import { formatCents } from "@/lib/utils";
import type { CostReport } from "@/lib/costs";

export function CostBreakdown({ report }: { report: CostReport | null }) {
  if (!report) {
    return (
      <div className="bg-card border border-border rounded-sm p-4">
        <div className="text-xs uppercase tracking-wide text-muted font-medium mb-3">Cost Breakdown</div>
        <div className="text-xs text-muted text-center py-4">No cost data — costs.json not found</div>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((report.mtdSpend / report.budget) * 100));
  const barColor = pct >= 90 ? "bg-[var(--status-error)]" : pct >= 70 ? "bg-[var(--status-idle)]" : "bg-[var(--status-active)]";

  return (
    <div className="bg-card border border-border rounded-sm p-4 space-y-4">
      <div className="text-xs uppercase tracking-wide text-muted font-medium">Cost Breakdown</div>
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-foreground font-medium">{formatCents(report.mtdSpend)} / {formatCents(report.budget)}</span>
          <span className="text-muted">{pct}%</span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      {report.byAgent && (
        <div className="space-y-1">
          <div className="text-xs text-muted mb-2">By agent</div>
          {Object.entries(report.byAgent).map(([agent, cents]) => (
            <div key={agent} className="flex justify-between text-xs">
              <span className="text-muted capitalize">{agent}</span>
              <span className="text-foreground">{formatCents(cents as number)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
