import { Sidebar } from "@/components/Sidebar";
import { OrgChart } from "@/components/OrgChart";
import { getProductRepos } from "@/lib/local";

export const revalidate = 5;

export default function TeamsPage() {
  const sidebarProjects = getProductRepos().map(r => ({
    name: r.name,
    url: `https://github.com/${r.owner}/${r.name}`,
  }));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#111111" }}>
      <Sidebar projects={sidebarProjects} />
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-6">
          <div className="text-[10px] uppercase tracking-widest text-[#888] mb-0.5">Organisation</div>
          <h1 className="text-sm font-semibold text-[#e8e8e8] mb-8">Teams</h1>
          <OrgChart />
        </div>
      </main>
    </div>
  );
}
