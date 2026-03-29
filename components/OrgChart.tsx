"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AgentDrawer } from "./AgentDrawer";
import { useAgents } from "@/lib/useAgents";
import { getAgentColor } from "@/lib/agents";
import type { AgentDef } from "@/lib/agents";
import type { Session, ActiveTaskFile } from "@/app/api/sessions/route";

interface AgentNode {
  id: string;
  name: string;
  description: string;
  children?: AgentNode[];
}

/** Build org hierarchy dynamically from agent list by category */
function buildOrgTree(agents: AgentDef[]): AgentNode | null {
  const byId = new Map(agents.map(a => [a.id, a]));
  const ceo = byId.get("ceo");
  if (!ceo) return agents[0] ? { id: agents[0].id, name: agents[0].name, description: agents[0].description } : null;

  // Direct reports to CEO
  const directReportIds = ["pm", "designer", "finance"];
  // Engineering group (under a virtual "Engineering" node or flat under CEO)
  const engineeringIds = ["frontend-dev", "backend-dev", "mobile-dev"];
  const engineeringSubIds = ["qa", "ops"];
  // Operations/research
  const opsIds = ["ai-researcher", "claude-code-manager"];

  function toNode(id: string): AgentNode | null {
    const a = byId.get(id);
    if (!a) return null;
    return { id: a.id, name: a.name, description: a.description };
  }

  // Build engineering children
  const engChildren = [...engineeringSubIds, ...opsIds]
    .map(toNode)
    .filter((n): n is AgentNode => n !== null);

  const engNodes = engineeringIds
    .map(toNode)
    .filter((n): n is AgentNode => n !== null);

  // Collect direct reports
  const directReports = directReportIds
    .map(toNode)
    .filter((n): n is AgentNode => n !== null);

  // Engineering group node — uses first engineering agent or synthetic
  const engineeringGroup: AgentNode = {
    id: engNodes[0]?.id ?? "frontend-dev",
    name: engNodes[0]?.name ?? "Engineering",
    description: "Implementation",
    children: [
      ...engNodes.slice(1),
      ...engChildren,
    ],
  };

  // Add any agents not in the predefined lists
  const knownIds = new Set(["ceo", ...directReportIds, ...engineeringIds, ...engineeringSubIds, ...opsIds]);
  const unknownAgents = agents
    .filter(a => !knownIds.has(a.id))
    .map(a => ({ id: a.id, name: a.name, description: a.description }));

  return {
    id: ceo.id,
    name: ceo.name,
    description: ceo.description,
    children: [
      ...directReports,
      engineeringGroup,
      ...unknownAgents,
    ],
  };
}

function isLive(agentId: string, sessions: Session[], activeTasks: ActiveTaskFile[]): { live: boolean; label: string | null } {
  // 1. Session agentType match
  for (const s of sessions) {
    if (s.agentType && s.agentType === agentId) {
      return { live: true, label: s.label };
    }
  }
  // 2. Active task files
  for (const t of activeTasks) {
    if (t.agentType && t.agentType === agentId) {
      return { live: true, label: t.label };
    }
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
  const color = getAgentColor(node.id);
  const { live, label } = isLive(node.id, sessions, activeTasks);

  return (
    <button
      onClick={() => onOpen(node.id, node.name)}
      className="flex flex-col items-center gap-2 group focus:outline-none"
    >
      {/* Avatar */}
      <div className="relative">
        {/* Pulsing live ring */}
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

        {/* Status dot */}
        <span
          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2"
          style={{ background: live ? color : "#4a4a4a", borderColor: "#111111" }}
        />
      </div>

      {/* Name + description */}
      <div className="text-center">
        <div className={`text-xs font-medium transition-colors ${live ? "text-[#e8e8e8]" : "text-[#888]"} group-hover:text-[#e8e8e8]`}>
          {node.name}
        </div>
        <div className="text-[10px] text-[#888] leading-tight mt-0.5 max-w-[90px]">{node.description}</div>
        {live && label && (
          <div className="text-[9px] mt-1 max-w-[90px] truncate px-1.5 py-0.5 rounded" style={{ background: color + "18", color: color + "cc" }}>
            {label}
          </div>
        )}
      </div>
    </button>
  );
}

export function OrgChart() {
  const agents = useAgents();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTasks, setActiveTasks] = useState<ActiveTaskFile[]>([]);
  const [openAgent, setOpenAgent] = useState<{ id: string; name: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function refresh() {
      try {
        const res = await fetch("/api/sessions", { cache: "no-store" });
        const data = await res.json();
        setSessions(data.sessions ?? []);
        setActiveTasks(data.activeTasks ?? []);
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    }
    setMounted(true);
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, []);

  const ORG = buildOrgTree(agents);

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

      {loading && (
        <div className="flex flex-col items-center gap-6 py-8 animate-pulse">
          <div className="w-14 h-14 rounded-xl bg-[#1e1e1e]" />
          <div className="flex items-start gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-[#1a1a1a]" />
                <div className="h-2 w-12 rounded bg-[#1a1a1a]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {ORG && (
        <div className={`overflow-x-auto pb-8 ${loading ? "hidden" : ""}`}>
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
      )}
    </>
  );
}
