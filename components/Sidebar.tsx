import { LayoutDashboard, Inbox, Tag, Target, Search } from "lucide-react";
import type { Agent } from "@/lib/agents";

interface Project {
  name: string;
  url: string;
}

interface SidebarProps {
  agents: (Agent & { status: string; currentTask: unknown | null })[];
  projects?: Project[];
}

const agentColors: Record<string, string> = {
  ceo: "#8b5cf6",
  pm: "#3b82f6",
  dev: "#06b6d4",
  qa: "#22c55e",
  ops: "#eab308",
  designer: "#ec4899",
  finance: "#6366f1",
};

export function Sidebar({ agents, projects = [] }: SidebarProps) {
  const liveAgents = agents.filter(a => a.status === "running");

  return (
    <aside style={{ width: 240, minWidth: 240, background: "#161616", borderRight: "1px solid #2a2a2a" }}
      className="hidden md:flex flex-col h-screen sticky top-0 overflow-y-auto">

      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#2a2a2a] flex items-center justify-center text-xs font-bold text-white">W</div>
          <span className="font-semibold text-[#e8e8e8] text-sm">Whitebox</span>
        </div>
        <Search size={14} className="text-[#666]" />
      </div>

      {/* Nav */}
      <div className="px-2 py-3 space-y-0.5">
        <button className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-[#e8e8e8] bg-[#2a2a2a] text-xs">
          <LayoutDashboard size={13} />
          <span className="flex-1 text-left">Dashboard</span>
          {liveAgents.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] bg-[#3b82f6] text-white px-1.5 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
              {liveAgents.length} live
            </span>
          )}
        </button>
        <button className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-[#666] hover:text-[#e8e8e8] text-xs">
          <Inbox size={13} />
          <span>Inbox</span>
        </button>
      </div>

      {/* Projects */}
      <div className="px-4 py-2">
        <div className="text-[10px] uppercase tracking-widest text-[#444] mb-2 font-medium">Projects</div>
        <div className="space-y-0.5">
          {projects.map((p, i) => {
            const colors = ["#ec4899", "#3b82f6", "#22c55e", "#8b5cf6", "#eab308", "#06b6d4", "#f97316"];
            return (
              <a key={p.name} href={p.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-1 py-1 rounded hover:bg-[#2a2a2a]">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors[i % colors.length] }} />
                <span className="text-xs text-[#999] truncate hover:text-[#ccc]">{p.name}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Work */}
      <div className="px-4 py-2">
        <div className="text-[10px] uppercase tracking-widest text-[#444] mb-2 font-medium">Work</div>
        <div className="space-y-0.5">
          {[{ icon: Tag, label: "Issues" }, { icon: Target, label: "Goals" }].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-[#2a2a2a] cursor-pointer">
              <Icon size={12} className="text-[#555]" />
              <span className="text-xs text-[#999]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Agents */}
      <div className="px-4 py-2">
        <div className="text-[10px] uppercase tracking-widest text-[#444] mb-2 font-medium">Agents</div>
        <div className="space-y-0.5">
          {agents.map(agent => (
            <div key={agent.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-[#2a2a2a]">
              <div className="w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                style={{ background: agentColors[agent.id] + "33", color: agentColors[agent.id] }}>
                {agent.name[0]}
              </div>
              <span className="text-xs text-[#999] flex-1">{agent.name}</span>
              {agent.status === "running" && (
                <span className="flex items-center gap-1 text-[10px] bg-[#1d3557] text-[#3b82f6] px-1.5 py-0.5 rounded-full">
                  <span className="w-1 h-1 rounded-full bg-[#3b82f6] inline-block animate-pulse" />
                  1 live
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Company */}
      <div className="mt-auto px-4 py-3 border-t border-[#2a2a2a]">
        <div className="text-[10px] uppercase tracking-widest text-[#444] mb-1 font-medium">Company</div>
        <div className="text-xs text-[#555]">wkliwk</div>
      </div>
    </aside>
  );
}
