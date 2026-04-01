"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AgentDrawer } from "./AgentDrawer";
import { useAgents } from "@/lib/useAgents";
import { getAgentColor } from "@/lib/agents";
import { relativeTime } from "@/lib/utils";
import type { AgentDef } from "@/lib/agents";
import type { Session, ActiveTaskFile } from "@/app/api/sessions/route";

interface AgentNode {
  id: string;
  name: string;
  role: string;
  children?: AgentNode[];
}

/** Build org hierarchy dynamically from agent list */
function buildOrgTree(agents: AgentDef[]): AgentNode {
  const byId = new Map(agents.map(a => [a.id, a]));

  function toNode(id: string, fallbackName: string, fallbackRole: string): AgentNode {
    const a = byId.get(id);
    return { id, name: a?.name ?? fallbackName, role: a?.description?.split(".")[0] ?? fallbackRole };
  }

  // Engineering agents that aren't the core roles
  const engineeringIds = agents
    .filter(a => a.category === "Engineering" && !["frontend-dev", "backend-dev", "mobile-dev", "qa", "ops"].includes(a.id))
    .map(a => toNode(a.id, a.name, a.description.split(".")[0]));

  // Operations agents (excluding finance which is a direct report)
  const opsAgents = agents
    .filter(a => a.category === "Operations" && a.id !== "finance")
    .map(a => toNode(a.id, a.name, a.description.split(".")[0]));

  const devChildren: AgentNode[] = [
    toNode("frontend-dev", "Frontend Dev", "React/TypeScript UI"),
    toNode("backend-dev", "Backend Dev", "API/Database"),
    toNode("mobile-dev", "Mobile Dev", "Expo/React Native"),
  ].filter(n => byId.has(n.id));

  const qaOps: AgentNode[] = [
    toNode("qa", "QA", "Code Review & Testing"),
    toNode("ops", "Ops", "CI/CD & Deploys"),
  ].filter(n => byId.has(n.id));

  // Dev lead node with sub-engineers
  const devNode: AgentNode = {
    id: "__dev-group__",
    name: "Engineering",
    role: "Implementation",
    children: [...devChildren, ...qaOps, ...engineeringIds],
  };

  const ceo = toNode("ceo", "CEO", "Strategy & Idea Gating");
  ceo.children = [
    toNode("pm", "PM", "Planning & PRDs"),
    toNode("designer", "Designer", "UI/UX Audits"),
    toNode("finance", "Finance", "Cost Management"),
    devNode,
    ...opsAgents,
  ].filter(n => n.id === "__dev-group__" || byId.has(n.id));

  return ceo;
}

function isLive(agentId: string, sessions: Session[], activeTasks: ActiveTaskFile[]): { live: boolean; label: string | null } {
  if (agentId.startsWith("__")) return { live: false, label: null };
  // 1. Exact agentType match
  for (const s of sessions) {
    if (s.agentType === agentId) return { live: true, label: s.label };
  }
  // 2. Active task files
  for (const t of activeTasks) {
    if (t.agentType === agentId) return { live: true, label: t.label };
  }
  // 3. Keyword fallback (untyped only)
  for (const s of sessions) {
    if (s.agentType) continue;
    const haystack = `${s.label ?? ""} ${s.title ?? ""} ${s.project ?? ""}`.toLowerCase();
    if (haystack.includes(agentId)) return { live: true, label: s.label };
  }
  return { live: false, label: null };
}

interface NodeCardProps {
  node: AgentNode;
  sessions: Session[];
  activeTasks: ActiveTaskFile[];
  onOpen: (id: string, name: string) => void;
  agentMap: Map<string, AgentDef>;
}

function NodeCard({ node, sessions, activeTasks, onOpen, agentMap }: NodeCardProps) {
  const isVirtual = node.id.startsWith("__");
  const color = getAgentColor(node.id);
  const { live, label } = isLive(node.id, sessions, activeTasks);
  const lastTask = agentMap.get(node.id)?.lastTask;

  return (
    <button
      onClick={isVirtual ? undefined : () => onOpen(node.id, node.name)}
      className={`flex flex-col items-center gap-2 group focus:outline-none${isVirtual ? " cursor-default" : ""}`}
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
        {!live && lastTask && (
          <div className="mt-1.5 space-y-0.5">
            <div className="text-[9px] text-[#666] max-w-[90px] truncate leading-tight">
              {lastTask.task.length > 50 ? lastTask.task.slice(0, 50) + "…" : lastTask.task || "completed task"}
            </div>
            <div className="flex items-center justify-center gap-1">
              <span className="text-[9px] text-[#444]">{relativeTime(lastTask.completedAt)}</span>
              {lastTask.issueNumber && lastTask.issueRepo && (
                <a
                  href={`https://github.com/${lastTask.issueRepo}/issues/${lastTask.issueNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="text-[9px] px-1 py-0.5 rounded bg-[#2a2a2a] text-[#666] hover:text-[#999] transition-colors"
                >
                  #{lastTask.issueNumber}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

export function OrgChart() {
  const agents = useAgents();
  const agentMap = new Map(agents.map(a => [a.id, a]));
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

      <div className={`overflow-x-auto pb-8 ${loading ? "hidden" : ""}`}>
        <div className="flex flex-col items-center min-w-max">
          {/* Root */}
          <NodeCard node={ORG} sessions={sessions} activeTasks={activeTasks} onOpen={(id, name) => setOpenAgent({ id, name })} agentMap={agentMap} />

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
                      <NodeCard node={child} sessions={sessions} activeTasks={activeTasks} onOpen={(id, name) => setOpenAgent({ id, name })} agentMap={agentMap} />

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
                                  <NodeCard node={gc} sessions={sessions} activeTasks={activeTasks} onOpen={(id, name) => setOpenAgent({ id, name })} agentMap={agentMap} />
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
