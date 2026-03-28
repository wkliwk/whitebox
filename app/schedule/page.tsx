import { Sidebar } from "@/components/Sidebar";
import { SchedulePanel } from "@/components/SchedulePanel";
import { getProductRepos } from "@/lib/local";

export default function SchedulePage() {
  const sidebarProjects = getProductRepos().map(r => ({
    name: r.name,
    url: `https://github.com/${r.owner}/${r.name}`,
  }));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#111111" }}>
      <Sidebar projects={sidebarProjects} />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 space-y-8">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888] mb-0.5">Schedule</div>
            <div className="text-sm text-[#888]">Cron jobs and autonomous loop history</div>
          </div>

          <SchedulePanel />
        </div>
      </main>
    </div>
  );
}
