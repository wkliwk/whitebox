import { StatusDot } from "./StatusDot";
import { relativeTime } from "@/lib/utils";

const agentColors: Record<string, string> = {
  ceo: "#8b5cf6", pm: "#3b82f6", dev: "#06b6d4", qa: "#22c55e",
  ops: "#eab308", designer: "#ec4899", finance: "#6366f1",
};

interface AgentRow {
  id: string; name: string; role: string; status: string;
  currentTask: { title: string; number: number; url: string; repo: string } | null;
  lastActive: string; completedCount: number;
}

export function AgentStatusPanel({ agents }: { agents: AgentRow[] }) {
  const sorted = [...agents].sort((a, b) => {
    if (a.status === "running" && b.status !== "running") return -1;
    if (b.status === "running" && a.status !== "running") return 1;
    return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
  });

  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-[#444] font-medium mb-3">Agent Status</div>
      <div className="space-y-0">
        {sorted.map(agent => {
          const color = agentColors[agent.id] || "#555";
          return (
            <div key={agent.id} className="flex items-center gap-3 py-2.5 border-b border-[#1e1e1e]">
              <StatusDot status={agent.status as "running" | "idle" | "error"} size="sm" />
              <div className="w-5 h-5 rounded-sm flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                style={{ background: color + "33", color }}>
                {agent.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-[#ccc] font-medium">{agent.name}</span>
                {agent.currentTask ? (
                  <a href={agent.currentTask.url} target="_blank" rel="noreferrer"
                    className="block text-[10px] text-[#3b82f6] hover:underline truncate">
                    #{agent.currentTask.number} {agent.currentTask.title.slice(0, 45)}{agent.currentTask.title.length > 45 ? "…" : ""}
                  </a>
                ) : (
                  <span className="block text-[10px] text-[#444]">Idle</span>
                )}
              </div>
              {agent.lastActive && (
                <span className="text-[10px] text-[#444] shrink-0">{relativeTime(agent.lastActive)}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
