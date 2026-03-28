"use client";

import { useState } from "react";
import { AgentStatusPanel } from "./AgentStatusPanel";
import { AgentDrawer } from "./AgentDrawer";
import { StatusDot } from "./StatusDot";

const agentColors: Record<string, string> = {
  ceo: "#8b5cf6", pm: "#3b82f6", dev: "#06b6d4", qa: "#22c55e",
  ops: "#eab308", designer: "#ec4899", finance: "#6366f1",
};

interface AgentRow {
  id: string; name: string; role: string; status: string;
  currentTask: { title: string; number: number; url: string; repo: string } | null;
  lastActive: string; completedCount: number;
}

export function AgentSection({ agents }: { agents: AgentRow[] }) {
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

  return (
    <>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-[#444] font-medium mb-3">Agent Status</div>
        <div className="space-y-0">
          {agents.map(agent => {
            const color = agentColors[agent.id] || "#555";
            return (
              <button key={agent.id} onClick={() => setSelected({ id: agent.id, name: agent.name })}
                className="w-full flex items-center gap-3 py-2.5 border-b border-[#1e1e1e] hover:bg-[#1a1a1a] -mx-2 px-2 rounded text-left">
                <StatusDot status={agent.status as "running" | "idle" | "error"} size="sm" />
                <div className="w-5 h-5 rounded-sm flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                  style={{ background: color + "33", color }}>
                  {agent.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-[#ccc] font-medium">{agent.name}</span>
                  {agent.currentTask ? (
                    <span className="block text-[10px] text-[#3b82f6] truncate">
                      #{agent.currentTask.number} {agent.currentTask.title.slice(0, 45)}{agent.currentTask.title.length > 45 ? "…" : ""}
                    </span>
                  ) : (
                    <span className="block text-[10px] text-[#444]">Idle — click to view role</span>
                  )}
                </div>
                <span className="text-[10px] text-[#3a3a3a] shrink-0">›</span>
              </button>
            );
          })}
        </div>
      </div>

      <AgentDrawer
        agentId={selected?.id ?? null}
        agentName={selected?.name ?? ""}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
