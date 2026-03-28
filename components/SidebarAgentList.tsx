"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { Session, ActiveTaskFile } from "@/app/api/sessions/route";
import { AGENTS } from "@/lib/agents";
import { AgentDrawer } from "./AgentDrawer";

const agentColors: Record<string, string> = {
  ceo: "#8b5cf6", pm: "#3b82f6", dev: "#06b6d4", qa: "#22c55e",
  ops: "#eab308", designer: "#ec4899", finance: "#6366f1",
};

const agentAliases: Record<string, string[]> = {
  ceo: ["ceo", "chief", "strategy", "idea"],
  pm: ["pm", "product", "planning", "prd", "issue"],
  dev: ["dev", "backend", "frontend", "implement", "build", "fix", "refactor"],
  qa: ["qa", "quality", "test", "review"],
  ops: ["ops", "deploy", "infra", "ci", "release"],
  designer: ["designer", "design", "ui ", "ux"],
  finance: ["finance", "cost", "billing"],
};

function normalizeAgentType(raw: string): string {
  if (raw === "frontend-dev" || raw === "backend-dev") return "dev";
  return raw;
}

interface AgentStatus {
  running: boolean;
  label: string | null;
  project: string | null;
}

function resolveAgentStatus(agentId: string, sessions: Session[], activeTasks: ActiveTaskFile[]): AgentStatus {
  // 1. Exact agentType match from session (new PID format)
  for (const s of sessions) {
    if (s.agentType && normalizeAgentType(s.agentType) === agentId) {
      return { running: true, label: s.label, project: s.project };
    }
  }

  // 2. Keyword fallback on session labels (old format, cwd matched)
  const aliases = agentAliases[agentId] ?? [agentId];
  for (const s of sessions) {
    if (s.agentType) continue;
    const haystack = `${s.label ?? ""} ${s.title ?? ""} ${s.project ?? ""}`.toLowerCase();
    if (aliases.some(a => haystack.includes(a))) {
      return { running: true, label: s.label, project: s.project };
    }
  }

  // 3. Active task files — covers case where lsof returns home dir (most common)
  for (const t of activeTasks) {
    if (t.agentType && normalizeAgentType(t.agentType) === agentId) {
      return { running: true, label: t.label, project: t.project };
    }
  }
  // Keyword match on task file labels
  for (const t of activeTasks) {
    if (t.agentType) continue;
    const haystack = `${t.label} ${t.project}`.toLowerCase();
    if (aliases.some(a => haystack.includes(a))) {
      return { running: true, label: t.label, project: t.project };
    }
  }

  return { running: false, label: null, project: null };
}

export function SidebarAgentList() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTasks, setActiveTasks] = useState<ActiveTaskFile[]>([]);
  const [openAgent, setOpenAgent] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    async function refresh() {
      try {
        const res = await fetch("/api/sessions", { cache: "no-store" });
        const data = await res.json();
        setSessions(data.sessions ?? []);
        setActiveTasks(data.activeTasks ?? []);
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

      <div className="space-y-0.5">
        {AGENTS.map(agent => {
          const color = agentColors[agent.id] || "#555";
          const { running, label, project } = resolveAgentStatus(agent.id, sessions, activeTasks);
          const subtitle = running ? (label ?? project ?? null) : null;

          return (
            <div key={agent.id}
              onClick={() => setOpenAgent({ id: agent.id, name: agent.name })}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#1e1e1e] transition-colors cursor-pointer group/agent">

              {/* Avatar */}
              <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ background: color + (running ? "33" : "18"), color: running ? color : color + "66" }}>
                {agent.name[0]}
              </div>

              {/* Name + subtitle */}
              <div className="flex-1 min-w-0">
                <span className={`text-xs ${running ? "text-[#ccc]" : "text-[#555]"}`}>
                  {agent.name}
                </span>
                {subtitle && (
                  <div className="text-[10px] truncate leading-tight" style={{ color: color + "88" }}>
                    {subtitle}
                  </div>
                )}
              </div>

              {/* Right side: live badge or chevron */}
              {running ? (
                <span className="flex items-center gap-1 shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: color + "18", color }}>
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping"
                      style={{ background: color }} />
                    <span className="relative inline-flex w-1.5 h-1.5 rounded-full"
                      style={{ background: color }} />
                  </span>
                  live
                </span>
              ) : (
                <ChevronRight size={10} className="text-[#2a2a2a] group-hover/agent:text-[#555] shrink-0 transition-colors" />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
