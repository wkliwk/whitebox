"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AgentDrawer } from "./AgentDrawer";
import type { Session, ActiveTaskFile } from "@/app/api/sessions/route";

const agentColors: Record<string, string> = {
  ceo: "#8b5cf6", pm: "#3b82f6", dev: "#06b6d4", qa: "#22c55e",
  ops: "#eab308", designer: "#ec4899", finance: "#6366f1",
  "frontend-dev": "#06b6d4", "backend-dev": "#3b82f6",
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

interface AgentNode {
  id: string;
  name: string;
  role: string;
  children?: AgentNode[];
}

// Org hierarchy
const ORG: AgentNode = {
  id: "ceo",
  name: "CEO",
  role: "Strategy & Idea Gating",
  children: [
    { id: "pm",       name: "PM",       role: "Planning & PRDs" },
    { id: "designer", name: "Designer", role: "UI/UX Audits" },
    { id: "finance",  name: "Finance",  role: "Cost Management" },
    {
      id: "dev",
      name: "Dev",
      role: "Implementation",
      children: [
        { id: "qa",  name: "QA",  role: "Code Review & Testing" },
        { id: "ops", name: "Ops", role: "CI/CD & Deploys" },
      ],
    },
  ],
};

function isLive(agentId: string, sessions: Session[], activeTasks: ActiveTaskFile[]): { live: boolean; label: string | null } {
  // 1. Session agentType match
  for (const s of sessions) {
    if (s.agentType && normalizeAgentType(s.agentType) === agentId) {
      return { live: true, label: s.label };
    }
  }
  // 2. Session keyword fallback
  const aliases = agentAliases[agentId] ?? [agentId];
  for (const s of sessions) {
    if (s.agentType) continue;
    const haystack = `${s.label ?? ""} ${s.title ?? ""} ${s.project ?? ""}`.toLowerCase();
    if (aliases.some(a => haystack.includes(a))) return { live: true, label: s.label };
  }
  // 3. Active task files (covers lsof → home dir case)
  for (const t of activeTasks) {
    if (t.agentType && normalizeAgentType(t.agentType) === agentId) {
      return { live: true, label: t.label };
    }
  }
  for (const t of activeTasks) {
    if (t.agentType) continue;
    const haystack = `${t.label} ${t.project}`.toLowerCase();
    if (aliases.some(a => haystack.includes(a))) return { live: true, label: t.label };
  }
  return { live: false, label: null };
}

interface NodeCardProps {
  node: AgentNode;
  sessions: Session[];
  activeTasks: ActiveTaskFile[];
  onOpen: (id: string, name: string) => void;
}

function NodeCard({ node, sessions, activeTasks, onOpen }: NodeCardProps) {
  const color = agentColors[node.id] ?? "#555";
  const { live, label } = isLive(node.id, sessions, activeTasks);

  return (
    <button
      onClick={() => onOpen(node.id, node.name)}
      className="flex flex-col items-center gap-2 group focus:outline-none"
    >
      {/* Avatar */}
      <div className="relative">
        {/* Pulsing live ring — renders behind avatar */}
        {live && (
          <span
            className="absolute -inset-1.5 rounded-2xl animate-ping"
            style={{ background: color + "40" }}
          />
        )}
        <div
          className="relative w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold transition-transform group-hover:scale-105"
          style={{
            background: color + (live ? "28" : "14"),
            border: `1.5px solid ${color + (live ? "88" : "30")}`,
            color: live ? color : color + "88",
          }}
        >
          {node.name[0]}
        </div>

        {/* Status dot — always visible, bottom-right corner */}
        <span
          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2"
          style={{ background: live ? color : "#4a4a4a", borderColor: "#111111" }}
        />
      </div>

      {/* Name + role */}
      <div className="text-center">
        <div className={`text-xs font-medium transition-colors ${live ? "text-[#e8e8e8]" : "text-[#888]"} group-hover:text-[#e8e8e8]`}>
          {node.name}
        </div>
        <div className="text-[10px] text-[#888] leading-tight mt-0.5 max-w-[90px]">{node.role}</div>
        {live && label && (
          <div className="text-[9px] mt-1 max-w-[90px] truncate px-1.5 py-0.5 rounded" style={{ background: color + "18", color: color + "cc" }}>
            {label}
          </div>
        )}
      </div>
    </button>
  );
}

interface OrgRowProps {
  nodes: AgentNode[];
  sessions: Session[];
  activeTasks: ActiveTaskFile[];
  onOpen: (id: string, name: string) => void;
  parentColor?: string;
}

/** Renders one horizontal row of nodes with vertical connector lines */
function OrgRow({ nodes, sessions, activeTasks, onOpen }: OrgRowProps) {
  return (
    <div className="flex items-start justify-center gap-12">
      {nodes.map(node => (
        <div key={node.id} className="flex flex-col items-center">
          <NodeCard node={node} sessions={sessions} activeTasks={activeTasks} onOpen={onOpen} />

          {/* Children */}
          {node.children && node.children.length > 0 && (
            <div className="flex flex-col items-center mt-1">
              {/* Vertical stem down */}
              <div className="w-px h-8 bg-[#2a2a2a]" />

              {/* Horizontal bar spanning children */}
              <div className="relative flex items-start justify-center gap-12">
                {/* Horizontal connector line */}
                {node.children.length > 1 && (
                  <div
                    className="absolute top-0 h-px bg-[#2a2a2a]"
                    style={{
                      left: `calc(50% - ${((node.children.length - 1) * (112 + 48)) / 2}px)`,
                      width: `${(node.children.length - 1) * (112 + 48)}px`,
                    }}
                  />
                )}

                {node.children.map(child => (
                  <div key={child.id} className="flex flex-col items-center">
                    {/* Vertical drop to child */}
                    <div className="w-px h-8 bg-[#2a2a2a]" />
                    <NodeCard node={child} sessions={sessions} activeTasks={activeTasks} onOpen={onOpen} />

                    {/* Grandchildren */}
                    {child.children && child.children.length > 0 && (
                      <div className="flex flex-col items-center mt-1">
                        <div className="w-px h-8 bg-[#2a2a2a]" />
                        <div className="relative flex items-start justify-center gap-12">
                          {child.children.length > 1 && (
                            <div
                              className="absolute top-0 h-px bg-[#2a2a2a]"
                              style={{
                                left: `calc(50% - ${((child.children.length - 1) * (112 + 48)) / 2}px)`,
                                width: `${(child.children.length - 1) * (112 + 48)}px`,
                              }}
                            />
                          )}
                          {child.children.map(gc => (
                            <div key={gc.id} className="flex flex-col items-center">
                              <div className="w-px h-8 bg-[#2a2a2a]" />
                              <NodeCard node={gc} sessions={sessions} activeTasks={activeTasks} onOpen={onOpen} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function OrgChart() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTasks, setActiveTasks] = useState<ActiveTaskFile[]>([]);
  const [openAgent, setOpenAgent] = useState<{ id: string; name: string } | null>(null);
  const [mounted, setMounted] = useState(false);

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
    setMounted(true);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {mounted && openAgent && createPortal(
        <AgentDrawer
          agentId={openAgent.id}
          agentName={openAgent.name}
          onClose={() => setOpenAgent(null)}
        />,
        document.body
      )}

      <div className="overflow-x-auto pb-8">
        <div className="flex flex-col items-center min-w-max">
          {/* Root */}
          <NodeCard node={ORG} sessions={sessions} activeTasks={activeTasks} onOpen={(id, name) => setOpenAgent({ id, name })} />

          {/* Children tree */}
          {ORG.children && ORG.children.length > 0 && (
            <div className="flex flex-col items-center">
              {/* Stem */}
              <div className="w-px h-10 bg-[#2a2a2a]" />

              {/* Horizontal bar */}
              <div className="relative w-full flex justify-center">
                <div
                  className="absolute top-0 h-px bg-[#2a2a2a]"
                  style={{
                    width: `${(ORG.children.length - 1) * 160}px`,
                    left: `calc(50% - ${((ORG.children.length - 1) * 160) / 2}px)`,
                  }}
                />

                <div className="flex items-start gap-10">
                  {ORG.children.map(child => (
                    <div key={child.id} className="flex flex-col items-center">
                      <div className="w-px h-10 bg-[#2a2a2a]" />
                      <NodeCard node={child} sessions={sessions} activeTasks={activeTasks} onOpen={(id, name) => setOpenAgent({ id, name })} />

                      {child.children && child.children.length > 0 && (
                        <div className="flex flex-col items-center">
                          <div className="w-px h-10 bg-[#2a2a2a]" />
                          {/* Horizontal bar for grandchildren */}
                          <div className="relative flex justify-center">
                            <div
                              className="absolute top-0 h-px bg-[#2a2a2a]"
                              style={{
                                width: `${(child.children.length - 1) * 120}px`,
                                left: `calc(50% - ${((child.children.length - 1) * 120) / 2}px)`,
                              }}
                            />
                            <div className="flex items-start gap-8">
                              {child.children.map(gc => (
                                <div key={gc.id} className="flex flex-col items-center">
                                  <div className="w-px h-10 bg-[#2a2a2a]" />
                                  <NodeCard node={gc} sessions={sessions} activeTasks={activeTasks} onOpen={(id, name) => setOpenAgent({ id, name })} />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-12 justify-center flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#8b5cf6" }} />
            <span className="text-[10px] text-[#777]">Live — running now</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#333]" />
            <span className="text-[10px] text-[#777]">Idle</span>
          </div>
          <div className="text-[10px] text-[#777]">· Click any node to view details</div>
        </div>
      </div>
    </>
  );
}
