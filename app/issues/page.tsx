import { Sidebar } from "@/components/Sidebar";
import { TaskList } from "@/components/TaskList";
import { getProductRepos } from "@/lib/local";
import { getRecentTasks } from "@/lib/github";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Issues — Whitebox",
};

export const revalidate = 30;

export default async function IssuesPage() {
  const [tasks, repos] = await Promise.all([
    getRecentTasks(),
    Promise.resolve(getProductRepos()),
  ]);

  const sidebarProjects = repos.map(r => ({
    name: r.name,
    url: `https://github.com/${r.owner}/${r.name}`,
  }));

  // Group tasks by product repo
  const byRepo = new Map<string, typeof tasks>();
  for (const t of tasks) {
    if (!byRepo.has(t.repo)) byRepo.set(t.repo, []);
    byRepo.get(t.repo)!.push(t);
  }

  const todo = tasks.filter(t => t.status === "todo");
  const inProgress = tasks.filter(t => t.status === "in-progress");
  const done = tasks.filter(t => t.status === "done");

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#111111" }}>
      <Sidebar projects={sidebarProjects} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-8">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888] mb-0.5">Issues</div>
            <div className="text-sm text-[#888]">
              {todo.length} open · {inProgress.length} in progress · {done.length} done
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Todo", count: todo.length, color: "#3b82f6" },
              { label: "In Progress", count: inProgress.length, color: "#eab308" },
              { label: "Done", count: done.length, color: "#22c55e" },
            ].map(s => (
              <div key={s.label} className="rounded-lg p-4 border border-[#222]" style={{ background: "#1c1c1c" }}>
                <div className="text-2xl font-bold tabular-nums" style={{ color: s.color }}>{s.count}</div>
                <div className="text-[10px] uppercase tracking-widest text-[#777] mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Full task list */}
          <TaskList tasks={tasks} />
        </div>
      </main>
    </div>
  );
}
