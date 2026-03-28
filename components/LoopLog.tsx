import type { LogEntry } from "@/lib/local";

export function LoopLog({ entries }: { entries: LogEntry[] }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-[#888] font-medium mb-3">Loop Log</div>
      {entries.length === 0 ? (
        <div className="text-xs text-[#888] py-4 text-center">No loop log entries yet</div>
      ) : (
        <div className="space-y-0">
          {entries.map((e, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-[#222]">
              <span className="text-[10px] text-[#888] shrink-0 mt-0.5 w-32">{e.timestamp}</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                style={{ background: "#3b82f622", color: "#3b82f6" }}>
                {e.product}
              </span>
              <span className="text-xs text-[#999] leading-relaxed">{e.action}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
