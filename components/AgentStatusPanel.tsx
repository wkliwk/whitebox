import { StatusDot } from "./StatusDot";
import { StatusBadge } from "./StatusBadge";
import { relativeTime } from "@/lib/utils";

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
    <div className="bg-card border border-border rounded-sm divide-y divide-border">
      <div className="px-4 py-2 text-xs uppercase tracking-wide text-muted font-medium">Agent Status</div>
      {sorted.map(agent => (
        <div key={agent.id} className="px-4 py-3 flex items-center gap-3">
          <StatusDot status={agent.status as "running" | "idle" | "error"} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{agent.name}</span>
              <span className="text-xs text-muted">{agent.role}</span>
            </div>
            {agent.currentTask ? (
              <a href={agent.currentTask.url} target="_blank" rel="noreferrer"
                className="text-xs text-[var(--status-running)] hover:underline truncate block">
                #{agent.currentTask.number} {agent.currentTask.title}
              </a>
            ) : (
              <span className="text-xs text-muted">Idle</span>
            )}
          </div>
          <div className="text-right shrink-0">
            <StatusBadge label={agent.name} status={agent.id} />
            {agent.lastActive && (
              <div className="text-xs text-muted mt-1">{relativeTime(agent.lastActive)}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
