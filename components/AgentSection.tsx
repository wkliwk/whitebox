"use client";

import { useState, useEffect } from "react";
import { AgentDrawer } from "./AgentDrawer";
import { StatusDot } from "./StatusDot";
import { useAgents } from "@/lib/useAgents";
import { getAgentColor } from "@/lib/agents";
import type { Session } from "@/app/api/sessions/route";

function getAgentStatus(agentId: string, sessions: Session[]): "running" | "idle" {
  const running = sessions.some(s => s.agentType === agentId);
  return running ? "running" : "idle";
}

export function AgentSection() {
  const agents = useAgents();
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    async function refresh() {
      try {
        const res = await fetch("/api/sessions", { cache: "no-store" });
        const data = await res.json();
        setSessions(data.sessions ?? []);
      } catch { /* silent */ }
    }
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-[#888] font-medium mb-3">Agent Status</div>
        <div className="space-y-0">
          {agents.map(agent => {
            const color = getAgentColor(agent.id);
            const status = getAgentStatus(agent.id, sessions);
            return (
              <button key={agent.id} onClick={() => setSelected({ id: agent.id, name: agent.name })}
                className="w-full flex items-center gap-3 py-2.5 border-b border-[#222] hover:bg-[#242424] -mx-2 px-2 rounded text-left">
                <StatusDot status={status as "running" | "idle" | "error"} size="sm" />
                <div className="w-5 h-5 rounded-sm flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                  style={{ background: color + "33", color }}>
                  {agent.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-[#ccc] font-medium">{agent.name}</span>
                  <span className="block text-[10px] text-[#888]">
                    {status === "running" ? "Active" : "Idle — click to view role"}
                  </span>
                </div>
                <span className="text-[10px] text-[#777] shrink-0">›</span>
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
