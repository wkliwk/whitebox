import { SidebarNav, SidebarFooter } from "./SidebarNav";
import { SidebarAgentList } from "./SidebarAgentList";
import { SidebarProjects } from "./SidebarProjects";
import { SidebarCollapsible } from "./SidebarCollapsible";
import { SidebarSearchTrigger } from "./SidebarSearchTrigger";
import { PRODUCTS } from "@/lib/products";

interface Project {
  name: string;
  url: string;
}

interface SidebarProps {
  projects?: Project[];
}

export function Sidebar({ projects = [] }: SidebarProps) {
  const productGroups = PRODUCTS.map(p => ({
    name: p.name,
    color: p.color,
    boardNumber: p.boardNumber,
    repos: p.repos.map(r => ({
      name: r.name,
      url: `https://github.com/${r.owner}/${r.name}`,
    })),
  }));

  return (
    <aside style={{ width: 240, minWidth: 240, background: "#161616", borderRight: "1px solid #2a2a2a" }}
      className="hidden md:flex flex-col h-screen sticky top-0 overflow-y-auto">

      {/* Logo */}
      <div className="flex items-center px-4 py-4 border-b border-[#2a2a2a] gap-2">
        <div className="w-7 h-7 rounded bg-[#2a2a2a] flex items-center justify-center text-xs font-bold text-white">W</div>
        <span className="font-semibold text-[#e8e8e8] text-sm">Whitebox</span>
      </div>

      {/* Search trigger */}
      <SidebarSearchTrigger />

      {/* Nav links (client — reads language context) */}
      <SidebarNav />

      {/* Agents (collapsible) */}
      <SidebarCollapsible labelKey="section_agents" defaultOpen>
        <SidebarAgentList />
      </SidebarCollapsible>

      {/* Products (collapsible) */}
      <SidebarCollapsible labelKey="section_products" defaultOpen={false}>
        <SidebarProjects projects={projects} productGroups={productGroups} />
      </SidebarCollapsible>

      {/* Company + language toggle */}
      <SidebarFooter />
    </aside>
  );
}
