import { ArrowUp, Minus } from "lucide-react";
import { relativeTime } from "@/lib/utils";
import { getAgentColor } from "@/lib/agents";
import type { RecentTask } from "@/lib/github";

const repoColors: Record<string, string> = {
  "money-flow-frontend": "#ec4899",
  "money-flow-backend": "#3b82f6",
  "money-flow-mobile": "#f97316",
  "whitebox": "#8b5cf6",
  "FormPilot": "#22c55e",
  "health-credit-frontend": "#eab308",
  "health-credit-backend": "#06b6d4",
};

function repoColor(repo: string): string {
  if (repoColors[repo]) return repoColors[repo];
  const palette = ["#ec4899", "#3b82f6", "#22c55e", "#8b5cf6", "#eab308", "#06b6d4", "#f97316"];
  return palette[repo.charCodeAt(0) % palette.length];
}

const statusDot = (status: string) => {
  if (status === "done") return <span className="w-2.5 h-2.5 rounded-full border-2 border-[#22c55e] bg-[#22c55e] flex-shrink-0" />;
  if (status === "in-progress") return <span className="w-2.5 h-2.5 rounded-full border-2 border-[#eab308] flex-shrink-0" />;
  return <span className="w-2.5 h-2.5 rounded-full border-2 border-[#3b82f6] flex-shrink-0" />;
};

const priorityIcon = (p: string) =>
  p === "p0" ? <ArrowUp size={11} className="text-[#ef4444] flex-shrink-0" /> : <Minus size={11} className="text-[#888] flex-shrink-0" />;

export function TaskList({ tasks }: { tasks: RecentTask[] }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-[#888] font-medium mb-3">Recent Tasks</div>
      {tasks.length === 0 ? (
        <div className="text-xs text-[#888] py-8 text-center">No recent tasks</div>
      ) : (
        <div className="space-y-0">
          {tasks.map((t, i) => {
            const color = repoColor(t.repo);
            return (
              <a key={i} href={t.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 py-2.5 border-b border-[#222] hover:bg-[#242424] -mx-2 px-2 rounded group">
                {priorityIcon(t.priority)}
                {statusDot(t.status)}
                <span className="flex-1 text-xs text-[#ccc] truncate group-hover:text-[#e8e8e8]">
                  {t.title}
                </span>
                {/* Product tag */}
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ background: color + "22", color }}>
                  {t.repo}
                </span>
                {t.agent && (() => {
                  const agentColor = getAgentColor(t.agent);
                  const agentLabel = t.agent.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                  return (
                    <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 font-medium"
                      style={{ background: agentColor + "22", color: agentColor }}>
                      {agentLabel}
                    </span>
                  );
                })()}
                <span className="text-[10px] text-[#888] flex-shrink-0 w-12 text-right">{relativeTime(t.updatedAt)}</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
