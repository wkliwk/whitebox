import { Sidebar } from "@/components/Sidebar";
import { ActivityFeed } from "@/components/ActivityFeed";
import { DecisionLog } from "@/components/DecisionLog";
import { LoopLog } from "@/components/LoopLog";
import { getDecisions, getLoopLog, getProductRepos } from "@/lib/local";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logs — Whitebox",
};

export const revalidate = 10;

export default async function LogsPage() {
  const [decisions, loopLog] = await Promise.all([
    getDecisions(50),
    getLoopLog(30),
  ]);

  const activityEvents = decisions.slice(0, 20).map(d => ({
    agent: d.project,
    verb: "worked on",
    entityType: "task",
    entityRef: d.date,
    entityTitle: d.summary,
    timestamp: d.date + "T00:00:00Z",
  }));

  const sidebarProjects = getProductRepos().map(r => ({
    name: r.name,
    url: `https://github.com/${r.owner}/${r.name}`,
  }));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#111111" }}>
      <Sidebar projects={sidebarProjects} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-8">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888] mb-0.5">Logs</div>
            <div className="text-sm text-[#888]">Activity history across all agents and projects</div>
          </div>

          {/* Recent Activity */}
          <ActivityFeed events={activityEvents} />

          {/* Loop Log */}
          <LoopLog entries={loopLog} />

          {/* Decision Log */}
          <DecisionLog decisions={decisions} />
        </div>
      </main>
    </div>
  );
}
