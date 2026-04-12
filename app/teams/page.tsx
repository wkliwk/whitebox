import { Sidebar } from "@/components/Sidebar";
import { OrgChart } from "@/components/OrgChart";
import { AgentPerformanceTable } from "@/components/AgentPerformanceTable";
import { getProductRepos } from "@/lib/local";
import { getAgentPerformanceMetrics } from "@/lib/github";
import { getSessionHistory } from "@/lib/redis";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teams — Whitebox",
};

export const revalidate = 30;

export default async function TeamsPage() {
  const sidebarProjects = getProductRepos().map(r => ({
    name: r.name,
    url: `https://github.com/${r.owner}/${r.name}`,
  }));

  // Fetch performance data in parallel — gracefully degrades if either source fails
  const [summary, sessionHistory] = await Promise.all([
    getAgentPerformanceMetrics(7).catch(() => ({
      totalIssuesClosed: 0,
      avgCloseTimeMs: null as number | null,
      agents: [],
      windowDays: 7,
    })),
    getSessionHistory().catch(() => []),
  ]);

  // Merge Redis session cost data into per-agent metrics
  const costByAgent = new Map<string, number>();
  const windowCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const session of sessionHistory) {
    if (!session.costUsd) continue;
    const sessionTime = session.completedAt
      ? new Date(session.completedAt).getTime()
      : 0;
    if (sessionTime < windowCutoff) continue;
    const existing = costByAgent.get(session.agentType) ?? 0;
    costByAgent.set(session.agentType, existing + session.costUsd);
  }

  // Apply cost data to agents
  for (const agent of summary.agents) {
    agent.totalCostUsd = costByAgent.get(agent.agentType) ?? 0;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#111111" }}>
      <Sidebar projects={sidebarProjects} />
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 max-w-[1200px]">
          <div className="text-[10px] uppercase tracking-widest text-[#888] mb-0.5">Organisation</div>
          <h1 className="text-sm font-semibold text-[#e8e8e8] mb-8">Teams</h1>
          <OrgChart />

          {/* Performance section */}
          <div className="mt-16">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[#888] mb-0.5">Analytics</div>
                <h2 className="text-sm font-semibold text-[#e8e8e8]">Agent Performance</h2>
              </div>
              <span className="text-[10px] text-[#555]">Last 7 days</span>
            </div>
            <AgentPerformanceTable summary={summary} />
          </div>
        </div>
      </main>
    </div>
  );
}
