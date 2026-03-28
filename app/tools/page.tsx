import { Sidebar } from "@/components/Sidebar";
import { getProductRepos } from "@/lib/local";
import { ToolsPanel } from "@/components/ToolsPanel";

export default function ToolsPage() {
  const sidebarProjects = getProductRepos().map(r => ({
    name: r.name,
    url: `https://github.com/${r.owner}/${r.name}`,
  }));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#111111" }}>
      <Sidebar projects={sidebarProjects} />
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 space-y-6">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#444] mb-0.5">Integrations</div>
            <h1 className="text-sm font-semibold text-[#e8e8e8]">Tools</h1>
          </div>
          <ToolsPanel />
        </div>
      </main>
    </div>
  );
}
