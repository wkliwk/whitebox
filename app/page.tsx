import { Bot, CheckSquare, Activity, DollarSign } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { MetricCard } from "@/components/MetricCard";
import { QuotaCard } from "@/components/QuotaCard";
import { LiveSessions } from "@/components/LiveSessions";
import { RefreshIndicator } from "@/components/RefreshIndicator";
import { CostChart } from "@/components/CostChart";
import { getDecisions, getAgentActivity, getProductRepos, getDailyActivity, getCostReport } from "@/lib/local";
import { getRecentTasks } from "@/lib/github";
import { AgentCostBreakdown } from "@/components/AgentCostBreakdown";
import { SessionHistory } from "@/components/SessionHistory";
import { TodayGlance } from "@/components/TodayGlance";
import { formatSpend, budgetPct } from "@/lib/costs";

export const revalidate = 30;

export default async function Page() {
  const [decisions, activity, tasks, dailyActivity, costReport] = await Promise.all([
    getDecisions(),
    getAgentActivity(),
    getRecentTasks(),
    getDailyActivity(),
    getCostReport(),
  ]);

  const repos = getProductRepos();

  const openTasks = tasks.filter(t => t.status === "todo").length;
  const inProgressTasks = tasks.filter(t => t.status === "in-progress").length;

  const today = new Date().toISOString().slice(0, 10);
  const activeProjects = activity.filter(a => {
    const daysSince = (Date.now() - new Date(a.lastDate).getTime()) / 86400000;
    return daysSince < 1;
  }).length;
  const decisionsToday = decisions.filter(d => d.date === today).length;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#111111" }}>
      <Sidebar projects={repos.map(r => ({
        name: r.name,
        url: `https://github.com/${r.owner}/${r.name}`,
      }))} />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#888] mb-0.5">Dashboard</div>
              <div className="text-sm text-[#888]">
                {activeProjects > 0
                  ? <>{activeProjects} active project{activeProjects !== 1 ? "s" : ""} · {openTasks} open · {inProgressTasks} in progress</>
                  : <>Whitebox — {tasks.length} tasks tracked</>
                }
              </div>
            </div>
            <RefreshIndicator />
          </div>

          {/* Live Sessions */}
          <LiveSessions />

          {/* Today at a glance */}
          <TodayGlance doneTasks={tasks.filter(t => t.status === "done")} />

          {/* Session History */}
          <SessionHistory />

          {/* Metric Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
            <QuotaCard />
            <MetricCard
              icon={Bot}
              label="Active Projects"
              value={activeProjects}
              subtitle={`${activity.length} total tracked`}
              isActive={activeProjects > 0}
            />
            <MetricCard
              icon={Activity}
              label="Decisions Today"
              value={decisionsToday}
              subtitle={`${decisions.length} total`}
            />
            <MetricCard
              icon={CheckSquare}
              label="Open Tasks"
              value={tasks.filter(t => t.status === "todo").length}
              subtitle={`${tasks.filter(t => t.status === "in-progress").length} in progress`}
            />
            <MetricCard
              icon={DollarSign}
              label={costReport ? `Spend ${costReport.month}` : "Monthly Spend"}
              value={costReport ? formatSpend(costReport.mtdSpend) : "--"}
              subtitle={costReport ? `${budgetPct(costReport)}% of ${formatSpend(costReport.budget)} budget` : "costs.json not found"}
            />
          </div>

          {/* Agent Cost Breakdown */}
          <div className="rounded-xl border border-[#222] bg-[#161616] p-5">
            <AgentCostBreakdown report={costReport} />
          </div>

          {/* Activity Chart */}
          {dailyActivity.filter(d => d.count > 0).length >= 2 && (
            <CostChart bars={dailyActivity} />
          )}

          {/* Recent Decisions */}
          <div className="rounded-xl border border-[#222] bg-[#161616] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] uppercase tracking-widest text-[#888] font-medium">Recent Decisions</div>
              <Link href="/logs" className="text-[11px] text-[#555] hover:text-[#999] transition-colors">
                View all →
              </Link>
            </div>
            {decisions.length === 0 ? (
              <div className="text-xs text-[#555] py-4 text-center">No decisions logged yet</div>
            ) : (
              <div className="space-y-0">
                {decisions.slice(0, 5).map((d, i) => (
                  <div key={i} className="py-2.5 border-b border-[#1e1e1e] last:border-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] text-[#666] font-mono">{d.project}</span>
                      <span className="text-[10px] text-[#444]">·</span>
                      <span className="text-[10px] text-[#444]">{d.date}</span>
                    </div>
                    <p className="text-xs text-[#888] leading-relaxed">
                      {d.summary.length > 120 ? d.summary.slice(0, 120) + "…" : d.summary}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
