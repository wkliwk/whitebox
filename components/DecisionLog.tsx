import type { Decision } from "@/lib/decisions";

const projectColors: Record<string, string> = {
  "money-flow-frontend": "#ec4899",
  "money-flow-backend": "#3b82f6",
  "money-flow-mobile": "#06b6d4",
  "whitebox": "#8b5cf6",
  "FormPilot": "#22c55e",
  "health-credit": "#eab308",
  "ai-company": "#f97316",
};

export function DecisionLog({ decisions }: { decisions: Decision[] }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-[#888] font-medium mb-3">Decision Log</div>
      {decisions.length === 0 ? (
        <div className="text-xs text-[#888] py-8 text-center">No decisions logged yet</div>
      ) : (
        <div className="space-y-0">
          {decisions.map((d, i) => {
            const color = projectColors[d.project] || "#555";
            return (
              <div key={i} className="py-2.5 border-b border-[#222]">
                <div className="flex items-center gap-2 mb-1">
                  <a href={`https://github.com/wkliwk/${d.project}`} target="_blank" rel="noreferrer"
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded hover:opacity-80"
                    style={{ background: color + "22", color }}>
                    {d.project}
                  </a>
                  <span className="text-[10px] text-[#888]">{d.date}</span>
                </div>
                <p className="text-xs text-[#999] leading-relaxed">
                  {d.summary.length > 120 ? d.summary.slice(0, 120) + "…" : d.summary}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
