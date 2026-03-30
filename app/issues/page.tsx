import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { TaskList } from "@/components/TaskList";
import { getProductRepos } from "@/lib/local";
import { getRecentTasks } from "@/lib/github";
import { PRODUCTS } from "@/lib/products";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Issues — Whitebox",
};

export const revalidate = 30;

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ repo?: string }>;
}) {
  const { repo: activeRepo } = await searchParams;

  const [tasks, repos] = await Promise.all([
    getRecentTasks(),
    Promise.resolve(getProductRepos()),
  ]);

  const sidebarProjects = repos.map(r => ({
    name: r.name,
    url: `https://github.com/${r.owner}/${r.name}`,
  }));

  // Group tasks by repo — only repos with at least 1 task get a pill
  const byRepo = new Map<string, typeof tasks>();
  for (const t of tasks) {
    if (!byRepo.has(t.repo)) byRepo.set(t.repo, []);
    byRepo.get(t.repo)!.push(t);
  }
  const reposWithTasks = [...byRepo.keys()].sort();

  // Apply filter
  const filtered = activeRepo ? (byRepo.get(activeRepo) ?? []) : tasks;

  const todo = filtered.filter(t => t.status === "todo");
  const inProgress = filtered.filter(t => t.status === "in-progress");
  const done = filtered.filter(t => t.status === "done");

  // Build color map from PRODUCTS
  const repoColor = new Map<string, string>();
  for (const p of PRODUCTS) {
    for (const r of p.repos) repoColor.set(r.name, p.color);
  }

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

          {/* Repo filter pills */}
          <div className="flex flex-wrap gap-2">
            <Link
              href="/issues"
              className="text-[11px] px-3 py-1 rounded-full border transition-colors"
              style={!activeRepo
                ? { background: "#3b82f622", color: "#3b82f6", borderColor: "#3b82f6" }
                : { background: "transparent", color: "#666", borderColor: "#2a2a2a" }}>
              All
            </Link>
            {reposWithTasks.map(repo => {
              const color = repoColor.get(repo) ?? "#888";
              const active = activeRepo === repo;
              return (
                <Link
                  key={repo}
                  href={`/issues?repo=${repo}`}
                  className="text-[11px] px-3 py-1 rounded-full border transition-colors"
                  style={active
                    ? { background: color + "22", color, borderColor: color }
                    : { background: "transparent", color: "#666", borderColor: "#2a2a2a" }}>
                  {repo}
                  <span className="ml-1.5 opacity-60">{byRepo.get(repo)!.length}</span>
                </Link>
              );
            })}
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

          {/* Filtered task list */}
          <TaskList tasks={filtered} />
        </div>
      </main>
    </div>
  );
}
