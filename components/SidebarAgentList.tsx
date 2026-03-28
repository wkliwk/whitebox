"use client";

import { useEffect, useState } from "react";
import type { Session } from "@/app/api/sessions/route";
import { AGENTS } from "@/lib/agents";
import { AgentDrawer } from "./AgentDrawer";

const agentColors: Record<string, string> = {
  ceo: "#8b5cf6", pm: "#3b82f6", dev: "#06b6d4", qa: "#22c55e",
  ops: "#eab308", designer: "#ec4899", finance: "#6366f1",
};

/** Aliases for keyword fallback (when no agentType line in task file) */
const agentAliases: Record<string, string[]> = {
  ceo: ["ceo", "chief", "strategy", "idea"],
  pm: ["pm", "product", "planning", "prd", "issue"],
  dev: ["dev", "backend", "frontend", "implement", "build", "fix", "refactor"],
  qa: ["qa", "quality", "test", "review"],
  ops: ["ops", "deploy", "infra", "ci", "release"],
  designer: ["designer", "design", "ui ", "ux"],
  finance: ["finance", "cost", "billing"],
};

/** Normalize agent type from task file — handles "frontend-dev", "backend-dev" → "dev" */
function normalizeAgentType(raw: string): string {
  if (raw === "frontend-dev" || raw === "backend-dev") return "dev";
  return raw;
}

interface AgentStatus {
  running: boolean;
  label: string | null;
  project: string | null;
}

function resolveAgentStatus(agentId: string, sessions: Session[]): AgentStatus {
  // 1. Exact agentType match (new format)
  for (const s of sessions) {
    if (s.agentType && normalizeAgentType(s.agentType) === agentId) {
      return { running: true, label: s.label, project: s.project };
    }
  }

  // 2. Keyword fallback (old format — no agentType in file)
  const aliases = agentAliases[agentId] ?? [agentId];
  for (const s of sessions) {
    if (s.agentType) continue; // already handled above
    const haystack = `${s.label ?? ""} ${s.title ?? ""} ${s.project ?? ""}`.toLowerCase();
    if (aliases.some(a => haystack.includes(a))) {
      return { running: true, label: s.label, project: s.project };
    }
  }

  return { running: false, label: null, project: null };
}

export function SidebarAgentList() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [openAgent, setOpenAgent] = useState<{ id: string; name: string } | null>(null);

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
      {openAgent && (
        <AgentDrawer
          agentId={openAgent.id}
          agentName={openAgent.name}
          onClose={() => setOpenAgent(null)}
        />
      )}

      <div className="space-y-0">
        {AGENTS.map(agent => {
          const color = agentColors[agent.id] || "#555";
          const { running, label, project } = resolveAgentStatus(agent.id, sessions);

          return (
            <div key={agent.id}
              onClick={() => setOpenAgent({ id: agent.id, name: agent.name })}
              className="flex items-start gap-2 px-1 py-1.5 rounded hover:bg-[#1e1e1e] transition-colors cursor-pointer">
              {/* Status dot */}
              <span className="relative flex w-1.5 h-1.5 shrink-0 mt-1">
                {running && (
                  <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping"
                    style={{ background: color }} />
                )}
                <span className="relative inline-flex w-1.5 h-1.5 rounded-full"
                  style={{ background: running ? color : "#2a2a2a" }} />
              </span>

              {/* Avatar */}
              <div className="w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5"
                style={{ background: color + "33", color }}>
                {agent.name[0]}
              </div>

              {/* Name + status */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs ${running ? "text-[#ccc]" : "text-[#555]"}`}>
                    {agent.name}
                  </span>
                  {running && (
                    <span className="text-[9px] px-1 py-0.5 rounded-full font-medium shrink-0"
                      style={{ background: color + "22", color }}>
                      live
                    </span>
                  )}
                </div>

                {/* Current task or idle state */}
                {running && label ? (
                  <div className="text-[10px] truncate mt-0.5" style={{ color: color + "aa" }}>
                    {label}
                  </div>
                ) : running && project ? (
                  <div className="text-[10px] text-[#444] truncate mt-0.5">{project}</div>
                ) : (
                  <div className="text-[10px] text-[#2e2e2e] mt-0.5">Idle</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
