import { StatusBadge } from "./StatusBadge";
import type { Decision } from "@/lib/decisions";

export function DecisionLog({ decisions }: { decisions: Decision[] }) {
  return (
    <div className="bg-card border border-border rounded-sm">
      <div className="px-4 py-2 text-xs uppercase tracking-wide text-muted font-medium border-b border-border">
        Decision Log
      </div>
      {decisions.length === 0 ? (
        <div className="px-4 py-8 text-center text-xs text-muted">No decisions — decisions.jsonl not found</div>
      ) : (
        <div className="divide-y divide-border">
          {decisions.map((d, i) => (
            <div key={i} className="px-4 py-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">{d.date}</span>
                <StatusBadge label={d.agent} status={d.agent} />
              </div>
              <p className="text-xs text-foreground leading-relaxed">{d.decision}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
