"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Session, ActiveTaskFile } from "@/app/api/sessions/route";
import { useAgents } from "@/lib/useAgents";
import { getAgentColor } from "@/lib/agents";
import { AgentDrawer } from "./AgentDrawer";

interface AgentStatus {
  running: boolean;
  stale: boolean;
  label: string | null;
  project: string | null;
}

function resolveAgentStatus(agentId: string, sessions: Session[], activeTasks: ActiveTaskFile[]): AgentStatus {
  // 1. Exact agentType match from live session (never stale — process is running)
  for (const s of sessions) {
    if (s.agentType && s.agentType === agentId) {
      return { running: true, stale: false, label: s.label, project: s.project };
    }
  }

  // 2. Active task files — exact agentType match
  for (const t of activeTasks) {
    if (t.agentType && t.agentType === agentId) {
      return { running: true, stale: t.isStale, label: t.label, project: t.project };
    }
  }

  return { running: false, stale: false, label: null, project: null };
}

export function SidebarAgentList() {
  const agents = useAgents();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTasks, setActiveTasks] = useState<ActiveTaskFile[]>([]);
  const [openAgent, setOpenAgent] = useState<{ id: string; name: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function refresh() {
      try {
        const res = await fetch("/api/sessions", { cache: "no-store" });
        const data = await res.json();
        setSessions(data.sessions ?? []);
        setActiveTasks(data.activeTasks ?? []);
      } catch { /* silent */ }
    }
    refresh();
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* Portal: render drawer at document.body to avoid stacking context issues */}
      {mounted && openAgent && createPortal(
        <AgentDrawer
          agentId={openAgent.id}
          agentName={openAgent.name}
          onClose={() => setOpenAgent(null)}
        />,
        document.body
      )}

      <div className="space-y-0.5">
        {agents.map(agent => {
          const color = getAgentColor(agent.id);
          const { running, stale, label, project } = resolveAgentStatus(agent.id, sessions, activeTasks);
          const subtitle = running ? (label ?? project ?? null) : null;
          const dotColor = stale ? "#eab308" : running ? color : "#4a4a4a";

          return (
            <div key={agent.id}
              onClick={() => setOpenAgent({ id: agent.id, name: agent.name })}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#242424] transition-colors cursor-pointer group/agent">

              {/* Avatar */}
              <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ background: color + (running ? "33" : "18"), color: running ? color : color + "66" }}>
                {agent.name[0]}
              </div>

              {/* Name + subtitle */}
              <div className="flex-1 min-w-0">
                <span className={`text-xs ${running ? "text-[#ccc]" : "text-[#777]"}`}>
                  {agent.name}
                </span>
                {subtitle && (
                  <div className="text-[10px] truncate leading-tight" style={{ color: color + "88" }}>
                    {subtitle}
                  </div>
                )}
              </div>

              {/* Status dot: pulsing green=live, yellow=stale, grey=idle */}
              <span className="shrink-0 relative flex w-2 h-2" title={stale ? "Stale — no update in >10 min" : undefined}>
                {running && !stale && (
                  <span className="absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping"
                    style={{ background: color }} />
                )}
                <span className="relative inline-flex w-2 h-2 rounded-full"
                  style={{ background: dotColor }} />
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
