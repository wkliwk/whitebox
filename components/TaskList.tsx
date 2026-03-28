import { ArrowUp, Minus } from "lucide-react";
import { relativeTime } from "@/lib/utils";
import type { RecentTask } from "@/lib/github";

const statusDot = (status: string) => {
  if (status === "done") return <span className="w-3 h-3 rounded-full border-2 border-[#22c55e] bg-[#22c55e] flex-shrink-0" />;
  if (status === "in-progress") return <span className="w-3 h-3 rounded-full border-2 border-[#eab308] flex-shrink-0" />;
  return <span className="w-3 h-3 rounded-full border-2 border-[#3b82f6] flex-shrink-0" />;
};

const priorityIcon = (p: string) =>
  p === "p0" ? <ArrowUp size={11} className="text-[#ef4444] flex-shrink-0" /> : <Minus size={11} className="text-[#444] flex-shrink-0" />;

export function TaskList({ tasks }: { tasks: RecentTask[] }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-[#444] font-medium mb-3">Recent Tasks</div>
      {tasks.length === 0 ? (
        <div className="text-xs text-[#444] py-8 text-center">No recent tasks</div>
      ) : (
        <div className="space-y-0">
          {tasks.map((t, i) => (
            <a key={i} href={t.url} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 py-2.5 border-b border-[#1e1e1e] hover:bg-[#1a1a1a] -mx-2 px-2 rounded group">
              {priorityIcon(t.priority)}
              {statusDot(t.status)}
              <span className="flex-1 text-xs text-[#ccc] truncate group-hover:text-[#e8e8e8]">
                {t.title}
              </span>
              {t.agent && (
                <span className="text-[10px] text-[#444] bg-[#222] px-1.5 py-0.5 rounded flex-shrink-0">
                  {t.agent.toUpperCase().slice(0, 2)}
                </span>
              )}
              <span className="text-[10px] text-[#444] flex-shrink-0">{relativeTime(t.updatedAt)}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
