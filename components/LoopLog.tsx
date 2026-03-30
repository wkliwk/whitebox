import type { LogEntry } from "@/lib/local";

const LEVEL_STYLES: Record<LogEntry["level"], { border: string; label: string; text: string }> = {
  error: { border: "#ef4444", label: "#ef4444", text: "#fca5a5" },
  warn:  { border: "#eab308", label: "#eab308", text: "#fde047" },
  info:  { border: "#3b82f6", label: "#3b82f6", text: "#93c5fd" },
  debug: { border: "#444",    label: "#555",    text: "#888"    },
};

export function LoopLog({ entries }: { entries: LogEntry[] }) {
  const errorCount = entries.filter(e => e.level === "error").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] uppercase tracking-widest text-[#888] font-medium">Loop Log</div>
        {errorCount > 0 && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: "#ef444422", color: "#ef4444" }}>
            {errorCount} error{errorCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      {entries.length === 0 ? (
        <div className="text-xs text-[#888] py-4 text-center">No loop log entries yet</div>
      ) : (
        <div className="space-y-0">
          {entries.map((e, i) => {
            const s = LEVEL_STYLES[e.level];
            return (
              <div key={i}
                className="flex items-start gap-3 py-2 border-b border-[#222] pl-2"
                style={{ borderLeft: `2px solid ${s.border}` }}>
                <span className="text-[10px] text-[#888] shrink-0 mt-0.5 w-32">{e.timestamp || "—"}</span>
                {e.product && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: `${s.label}22`, color: s.label }}>
                    {e.product}
                  </span>
                )}
                <span className="text-xs leading-relaxed" style={{ color: s.text }}>{e.action}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
