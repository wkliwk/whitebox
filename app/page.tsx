import { Bot, CircleDot, DollarSign, CheckSquare } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { MetricCard } from "@/components/MetricCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { TaskList } from "@/components/TaskList";
import { RefreshIndicator } from "@/components/RefreshIndicator";
import {
  getRecentEvents, getIssueStats, getCostReport,
  getAgentActivity, getRecentTasks,
} from "@/lib/github";
import { formatCents } from "@/lib/utils";

export const revalidate = 300;

export default async function Page() {
  const [events, stats, costReport, agents, tasks] = await Promise.all([
    getRecentEvents(),
    getIssueStats(),
    getCostReport(),
    getAgentActivity(),
    getRecentTasks(),
  ]);

  const activeAgents = agents.filter(a => a.status === "running").length;
  const idleAgents = agents.filter(a => a.status === "idle").length;
  const inProgressTasks = tasks.filter(t => t.status === "in-progress").length;
  const blockedTasks = 0; // extend later
  const mtdStr = costReport ? formatCents(costReport.mtdSpend) : "—";
  const budgetStr = costReport ? `${formatCents(costReport.budget)} budget` : "No budget set";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#111111" }}>
      <Sidebar agents={agents} />

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#444] mb-0.5">Dashboard</div>
              <div className="text-sm text-[#666]">Whitebox</div>
            </div>
            <RefreshIndicator />
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <MetricCard
              icon={Bot}
              label="Agents Enabled"
              value={agents.length}
              subtitle={`${activeAgents} running, ${idleAgents} idle, 0 errors`}
              isActive={activeAgents > 0}
            />
            <MetricCard
              icon={CircleDot}
              label="Tasks In Progress"
              value={inProgressTasks}
              subtitle={`${stats.openCount} open, ${blockedTasks} blocked`}
            />
            <MetricCard
              icon={DollarSign}
              label="Month Spend"
              value={mtdStr}
              subtitle={budgetStr}
            />
            <MetricCard
              icon={CheckSquare}
              label="Completed"
              value={tasks.filter(t => t.status === "done").length}
              subtitle="this period"
            />
          </div>

          {/* Activity + Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-8">
            <ActivityFeed events={events} />
            <TaskList tasks={tasks} />
          </div>
        </div>
      </main>
    </div>
  );
}
