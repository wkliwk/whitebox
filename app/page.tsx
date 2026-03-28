import { Bot, Zap, CheckSquare, Activity } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { MetricCard } from "@/components/MetricCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { TaskList } from "@/components/TaskList";
import { AgentSection } from "@/components/AgentSection";
import { DecisionLog } from "@/components/DecisionLog";
import { LoopLog } from "@/components/LoopLog";
import { LiveSessions } from "@/components/LiveSessions";
import { RefreshIndicator } from "@/components/RefreshIndicator";
import { getTokenUsage, getDecisions, getLoopLog, getAgentActivity, getProductRepos } from "@/lib/local";
import { getRecentTasks } from "@/lib/github";
import { AGENTS } from "@/lib/agents";

export const revalidate = 5;

export default async function Page() {
  const [usage, decisions, loopLog, activity, tasks] = await Promise.all([
    Promise.resolve(getTokenUsage()),
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
  const fiveHourPct = usage?.fiveHourPct ?? 0;
  const sevenDayPct = usage?.sevenDayPct ?? 0;
  const decisionsToday = decisions.filter(d => d.date === today).length;

  // Map AGENTS → sidebar shape (status derived from recent activity)
  const agentRows = AGENTS.map(agent => ({
    ...agent,
    status: "idle" as string,
    currentTask: null as null,
    lastActive: "",
    completedCount: 0,
  }));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#111111" }}>
      <Sidebar agents={agentRows} projects={getProductRepos().map(r => ({
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
            <MetricCard
              icon={Zap}
              label="5h Quota"
              value={`${fiveHourPct}%`}
              subtitle={usage ? `7-day: ${sevenDayPct}% used` : "No usage data"}
              isActive={fiveHourPct > 0 && fiveHourPct < 90}
            />
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
          <AgentSection agents={agentRows} />

          {/* Decisions */}
          <DecisionLog decisions={decisions} />
        </div>
      </main>
    </div>
  );
}
