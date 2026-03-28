"use client";

import { useEffect, useState } from "react";
import type { Session } from "@/app/api/sessions/route";
import { AGENTS } from "@/lib/agents";

const agentColors: Record<string, string> = {
  ceo: "#8b5cf6", pm: "#3b82f6", dev: "#06b6d4", qa: "#22c55e",
  ops: "#eab308", designer: "#ec4899", finance: "#6366f1",
};

/** Agent name aliases to match against session labels */
const agentAliases: Record<string, string[]> = {
  ceo: ["ceo", "chief", "strategy"],
  pm: ["pm", "product manager", "planning", "prd"],
  dev: ["dev", "backend", "backend-dev", "implement"],
  qa: ["qa", "quality", "test", "review"],
  ops: ["ops", "deploy", "infra", "ci"],
  designer: ["designer", "design", "ui", "ux"],
  finance: ["finance", "cost", "billing"],
};

function isAgentRunning(agentId: string, sessions: Session[]): boolean {
  const aliases = agentAliases[agentId] ?? [agentId];
  return sessions.some(s => {
    const haystack = `${s.label ?? ""} ${s.project ?? ""} ${s.title ?? ""}`.toLowerCase();
    return aliases.some(alias => haystack.includes(alias));
  });
}

export function SidebarAgentList() {
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
    <div className="space-y-0.5">
      {AGENTS.map(agent => {
        const color = agentColors[agent.id] || "#555";
        const running = isAgentRunning(agent.id, sessions);
        return (
          <div key={agent.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-[#2a2a2a]">
            {/* Status dot */}
            <span className="relative flex w-1.5 h-1.5 shrink-0">
              {running && (
                <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping"
                  style={{ background: color }} />
              )}
              <span className="relative inline-flex w-1.5 h-1.5 rounded-full"
                style={{ background: running ? color : "#2a2a2a" }} />
            </span>

            {/* Avatar */}
            <div className="w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-bold flex-shrink-0"
              style={{ background: color + "33", color }}>
              {agent.name[0]}
            </div>

            {/* Name */}
            <span className={`text-xs flex-1 ${running ? "text-[#ccc]" : "text-[#666]"}`}>{agent.name}</span>

            {/* Running badge */}
            {running && (
              <span className="text-[9px] px-1 py-0.5 rounded-full font-medium"
                style={{ background: color + "22", color }}>
                live
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
