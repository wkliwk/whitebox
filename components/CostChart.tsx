"use client";

interface DayBar {
  date: string;   // YYYY-MM-DD
  label: string;  // e.g. "Mon", "Tue"
  count: number;
}

interface CostChartProps {
  bars: DayBar[];
}

export function CostChart({ bars }: CostChartProps) {
  if (bars.length < 2) return null;

  const max = Math.max(...bars.map(b => b.count), 1);

  return (
    <div className="rounded-xl border border-[#222] bg-[#161616] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] uppercase tracking-widest text-[#888] font-medium">
          Agent Activity — Last 7 Days
        </div>
        <span className="text-[10px] text-[#555]">decisions / day</span>
      </div>

      <div className="flex items-end gap-1.5 h-20">
        {bars.map(bar => {
          const heightPct = max > 0 ? (bar.count / max) * 100 : 0;
          const isToday = bar.date === new Date().toISOString().slice(0, 10);
          return (
            <div key={bar.date} className="flex-1 flex flex-col items-center gap-1 group">
              {/* Bar */}
              <div className="w-full flex items-end justify-center" style={{ height: "60px" }}>
                <div
                  className="w-full rounded-t transition-all duration-300"
                  style={{
                    height: `${Math.max(heightPct, bar.count > 0 ? 4 : 0)}%`,
                    background: isToday ? "#3b82f6" : "#3b82f644",
                    minHeight: bar.count > 0 ? "3px" : "0",
                  }}
                  title={`${bar.date}: ${bar.count} decision${bar.count !== 1 ? "s" : ""}`}
                />
              </div>
              {/* Count */}
              <span className="text-[9px] tabular-nums text-[#555] group-hover:text-[#888] transition-colors">
                {bar.count > 0 ? bar.count : ""}
              </span>
              {/* Day label */}
              <span className={`text-[9px] ${isToday ? "text-[#3b82f6]" : "text-[#555]"}`}>
                {bar.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
