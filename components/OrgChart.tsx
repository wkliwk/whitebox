"use client";

import { useEffect, useState } from "react";
import { AgentDrawer } from "./AgentDrawer";
import type { Session } from "@/app/api/sessions/route";

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

function isLive(agentId: string, sessions: Session[]): { live: boolean; label: string | null } {
  for (const s of sessions) {
    if (s.agentType && normalizeAgentType(s.agentType) === agentId) {
      return { live: true, label: s.label };
    }
  }
  const aliases = agentAliases[agentId] ?? [agentId];
  for (const s of sessions) {
    if (s.agentType) continue;
    const haystack = `${s.label ?? ""} ${s.title ?? ""} ${s.project ?? ""}`.toLowerCase();
    if (aliases.some(a => haystack.includes(a))) return { live: true, label: s.label };
  }
  return { live: false, label: null };
}

interface NodeCardProps {
  node: AgentNode;
  sessions: Session[];
  onOpen: (id: string, name: string) => void;
}

function NodeCard({ node, sessions, onOpen }: NodeCardProps) {
  const color = agentColors[node.id] ?? "#555";
  const { live, label } = isLive(node.id, sessions);

  return (
    <button
      onClick={() => onOpen(node.id, node.name)}
      className="flex flex-col items-center gap-1.5 group focus:outline-none"
    >
      {/* Avatar with live ring */}
      <div className="relative">
        {live && (
          <span className="absolute inset-0 rounded-xl animate-ping opacity-30"
            style={{ background: color }} />
        )}
        <div
          className="relative w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold transition-transform group-hover:scale-105"
          style={{
            background: color + (live ? "28" : "14"),
            border: `1.5px solid ${color + (live ? "66" : "28")}`,
            color,
          }}
        >
          {node.name[0]}
        </div>
        {/* Live dot */}
        {live && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#111]"
            style={{ background: color }} />
        )}
      </div>

      {/* Name */}
      <div className="text-center">
        <div className={`text-xs font-medium ${live ? "text-[#e8e8e8]" : "text-[#888]"} group-hover:text-[#e8e8e8] transition-colors`}>
          {node.name}
        </div>
        <div className="text-[10px] text-[#444] leading-tight mt-0.5">{node.role}</div>
        {live && label && (
          <div className="text-[9px] mt-0.5 max-w-[80px] truncate" style={{ color: color + "aa" }}>
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
  onOpen: (id: string, name: string) => void;
  parentColor?: string;
}

/** Renders one horizontal row of nodes with vertical connector lines */
function OrgRow({ nodes, sessions, onOpen }: OrgRowProps) {
  return (
    <div className="flex items-start justify-center gap-12">
      {nodes.map(node => (
        <div key={node.id} className="flex flex-col items-center">
          <NodeCard node={node} sessions={sessions} onOpen={onOpen} />

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
                    <NodeCard node={child} sessions={sessions} onOpen={onOpen} />

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
                              <NodeCard node={gc} sessions={sessions} onOpen={onOpen} />
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

      <div className="overflow-x-auto pb-8">
        <div className="flex flex-col items-center min-w-max">
          {/* Root */}
          <NodeCard node={ORG} sessions={sessions} onOpen={(id, name) => setOpenAgent({ id, name })} />

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
                      <NodeCard node={child} sessions={sessions} onOpen={(id, name) => setOpenAgent({ id, name })} />

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
                                  <NodeCard node={gc} sessions={sessions} onOpen={(id, name) => setOpenAgent({ id, name })} />
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
        <div className="flex items-center gap-4 mt-12 justify-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
            <span className="text-[10px] text-[#555]">Live — agent currently running</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2a2a2a]" />
            <span className="text-[10px] text-[#555]">Idle</span>
          </div>
          <div className="text-[10px] text-[#444]">· Click any node to view agent details</div>
        </div>
      </div>
    </>
  );
}
