"use client";

import { useState, useEffect } from "react";
import { AgentDrawer } from "./AgentDrawer";
import { StatusDot } from "./StatusDot";
import { AGENTS } from "@/lib/agents";
import type { Session } from "@/app/api/sessions/route";

const agentColors: Record<string, string> = {
  ceo: "#8b5cf6", pm: "#3b82f6", dev: "#06b6d4", qa: "#22c55e",
  ops: "#eab308", designer: "#ec4899", finance: "#6366f1",
};

const agentAliases: Record<string, string[]> = {
  ceo: ["ceo", "chief", "strategy"],
  pm: ["pm", "product manager", "planning", "prd"],
  dev: ["dev", "backend", "backend-dev", "implement"],
  qa: ["qa", "quality", "test", "review"],
  ops: ["ops", "deploy", "infra", "ci"],
  designer: ["designer", "design", "ui", "ux"],
  finance: ["finance", "cost", "billing"],
};

function getAgentStatus(agentId: string, sessions: Session[]): "running" | "idle" {
  const aliases = agentAliases[agentId] ?? [agentId];
  const running = sessions.some(s => {
    const haystack = `${s.label ?? ""} ${s.project ?? ""} ${s.title ?? ""}`.toLowerCase();
    return aliases.some(alias => haystack.includes(alias));
  });
  return running ? "running" : "idle";
}

export function AgentSection() {
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
        <div className="text-[10px] uppercase tracking-widest text-[#444] font-medium mb-3">Agent Status</div>
        <div className="space-y-0">
          {AGENTS.map(agent => {
            const color = agentColors[agent.id] || "#555";
            const status = getAgentStatus(agent.id, sessions);
            return (
              <button key={agent.id} onClick={() => setSelected({ id: agent.id, name: agent.name })}
                className="w-full flex items-center gap-3 py-2.5 border-b border-[#1e1e1e] hover:bg-[#1a1a1a] -mx-2 px-2 rounded text-left">
                <StatusDot status={status as "running" | "idle" | "error"} size="sm" />
                <div className="w-5 h-5 rounded-sm flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                  style={{ background: color + "33", color }}>
                  {agent.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-[#ccc] font-medium">{agent.name}</span>
                  <span className="block text-[10px] text-[#444]">
                    {status === "running" ? "Active" : "Idle — click to view role"}
                  </span>
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
