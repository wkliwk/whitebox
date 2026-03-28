import { Bot, CheckSquare, Activity } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { MetricCard } from "@/components/MetricCard";
import { QuotaCard } from "@/components/QuotaCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { TaskList } from "@/components/TaskList";
import { AgentSection } from "@/components/AgentSection";
import { DecisionLog } from "@/components/DecisionLog";
import { LoopLog } from "@/components/LoopLog";
import { LiveSessions } from "@/components/LiveSessions";
import { RefreshIndicator } from "@/components/RefreshIndicator";
import { getDecisions, getLoopLog, getAgentActivity, getProductRepos } from "@/lib/local";
import { getRecentTasks } from "@/lib/github";

export const revalidate = 5;

export default async function Page() {
  const [decisions, loopLog, activity, tasks] = await Promise.all([
    Promise.resolve(getDecisions()),
    Promise.resolve(getLoopLog()),
    Promise.resolve(getAgentActivity()),
    getRecentTasks(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const activeProjects = activity.filter(a => {
    const daysSince = (Date.now() - new Date(a.lastDate).getTime()) / 86400000;
    return daysSince < 1;
  }).length;
  const decisionsToday = decisions.filter(d => d.date === today).length;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#111111" }}>
      <Sidebar projects={getProductRepos().map(r => ({
        name: r.name,
        url: `https://github.com/${r.owner}/${r.name}`,
      }))} />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#444] mb-0.5">Dashboard</div>
              <div className="text-sm text-[#666]">Whitebox — Local</div>
            </div>
            <RefreshIndicator />
          </div>

          {/* Live Sessions — client polled, always fresh */}
          <LiveSessions />

          {/* Metric Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
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
              subtitle={`${decisions.length} shown total`}
            />
            <MetricCard
              icon={CheckSquare}
              label="Open Tasks"
              value={tasks.filter(t => t.status === "todo").length}
              subtitle={`${tasks.filter(t => t.status === "in-progress").length} in progress`}
            />
          </div>

          {/* Activity Feed + Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-8">
            <ActivityFeed events={decisions.slice(0, 15).map(d => ({
              agent: d.project,
              verb: "worked on",
              entityType: "task",
              entityRef: d.date,
              entityTitle: d.summary,
              timestamp: d.date + "T00:00:00Z",
            }))} />
            <TaskList tasks={tasks} />
          </div>

          {/* Loop Log */}
          <LoopLog entries={loopLog} />

          {/* Agent Status */}
          <AgentSection />

          {/* Decisions */}
          <DecisionLog decisions={decisions} />
        </div>
      </main>
    </div>
  );
}
