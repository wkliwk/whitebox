import { relativeTime } from "@/lib/utils";
import type { GitHubEvent } from "@/lib/github";

const agentColors: Record<string, string> = {
  ceo: "#8b5cf6", pm: "#3b82f6", dev: "#06b6d4", qa: "#22c55e",
  ops: "#eab308", designer: "#ec4899", finance: "#6366f1", founder: "#f97316",
};

function AgentAvatar({ name }: { name: string }) {
  const key = name.toLowerCase().replace(/[^a-z]/g, "");
  const color = agentColors[key] || "#555";
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
      style={{ background: color + "33", color, border: `1px solid ${color}44` }}>
      {initials}
    </div>
  );
}

export function ActivityFeed({ events }: { events: GitHubEvent[] }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-[#444] font-medium mb-3">Recent Activity</div>
      {events.length === 0 ? (
        <div className="text-xs text-[#444] py-8 text-center">No recent activity</div>
      ) : (
        <div className="space-y-0">
          {events.map((e, i) => (
            <div key={i} className="flex items-start gap-2.5 py-2.5 border-b border-[#1e1e1e]">
              <AgentAvatar name={e.agent} />
              <div className="flex-1 min-w-0 leading-relaxed">
                <span className="text-[#e8e8e8] font-medium">{e.agent}</span>
                <span className="text-[#666]"> {e.verb} </span>
                {e.entityRef && (
                  <span className="text-[#e8e8e8] font-medium">{e.entityRef}</span>
                )}
                {e.entityTitle && (
                  <span className="text-[#555]"> — {e.entityTitle.slice(0, 40)}{e.entityTitle.length > 40 ? "…" : ""}</span>
                )}
              </div>
              <span className="text-[10px] text-[#444] shrink-0 mt-0.5">
                {e.timestamp ? relativeTime(e.timestamp) : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
