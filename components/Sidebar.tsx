import { LayoutDashboard, Package, ScrollText, CircleDot, Info, CalendarClock, Search } from "lucide-react";
import { SidebarAgentList } from "./SidebarAgentList";

interface Project {
  name: string;
  url: string;
}

interface SidebarProps {
  projects?: Project[];
}

export function Sidebar({ projects = [] }: SidebarProps) {
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
        <a href="/" className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-[#999] hover:text-[#e8e8e8] hover:bg-[#1e1e1e] text-xs">
          <LayoutDashboard size={13} />
          <span className="flex-1 text-left">Dashboard</span>
        </a>
        <a href="/products" className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-[#666] hover:text-[#e8e8e8] hover:bg-[#1e1e1e] text-xs">
          <Package size={13} />
          <span>Products</span>
        </a>
        <a href="/issues" className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-[#666] hover:text-[#e8e8e8] hover:bg-[#1e1e1e] text-xs">
          <CircleDot size={13} />
          <span>Issues</span>
        </a>
        <a href="/logs" className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-[#666] hover:text-[#e8e8e8] hover:bg-[#1e1e1e] text-xs">
          <ScrollText size={13} />
          <span>Logs</span>
        </a>
        <a href="/schedule" className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-[#666] hover:text-[#e8e8e8] hover:bg-[#1e1e1e] text-xs">
          <CalendarClock size={13} />
          <span>Schedule</span>
        </a>
        <a href="/about" className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-[#666] hover:text-[#e8e8e8] hover:bg-[#1e1e1e] text-xs">
          <Info size={13} />
          <span>About</span>
        </a>
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

      {/* Agents */}
      <div className="px-4 py-2">
        <div className="text-[10px] uppercase tracking-widest text-[#444] mb-2 font-medium">Agents</div>
        <SidebarAgentList />
      </div>

      {/* Company */}
      <div className="mt-auto px-4 py-3 border-t border-[#2a2a2a]">
        <div className="text-[10px] uppercase tracking-widest text-[#444] mb-1 font-medium">Company</div>
        <div className="text-xs text-[#555]">wkliwk</div>
      </div>
    </aside>
  );
}
