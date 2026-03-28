import { Bot, CircleDot, DollarSign, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { AgentStatusPanel } from "@/components/AgentStatusPanel";
import { ActivityFeed } from "@/components/ActivityFeed";
import { CostBreakdown } from "@/components/CostBreakdown";
import { DecisionLog } from "@/components/DecisionLog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RefreshIndicator } from "@/components/RefreshIndicator";
import { getRecentEvents, getIssueStats, getCostReport, getDecisions, getAgentActivity } from "@/lib/github";
import { formatCents } from "@/lib/utils";

export const revalidate = 300;

export default async function Page() {
  const [events, stats, costReport, decisions, agents] = await Promise.all([
    getRecentEvents(),
    getIssueStats(),
    getCostReport(),
    getDecisions(),
    getAgentActivity(),
  ]);

  const activeAgents = agents.filter(a => a.status === "running").length;
  const mtdStr = costReport ? formatCents(costReport.mtdSpend) : "—";
  const budgetStr = costReport ? formatCents(costReport.budget) : "";
  const pct = costReport ? `${Math.round((costReport.mtdSpend / costReport.budget) * 100)}% of budget` : "No data";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Whitebox</h1>
            <p className="text-xs text-muted">AI agent ops dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <RefreshIndicator />
            <ThemeToggle />
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard icon={Bot} label="Agents Active" value={`${activeAgents} of ${agents.length}`} />
          <MetricCard icon={CircleDot} label="In Progress" value={String(stats.inProgressCount)} />
          <MetricCard icon={DollarSign} label="MTD Spend" value={mtdStr} subtitle={budgetStr ? `${mtdStr} / ${budgetStr}` : pct} />
          <MetricCard icon={TrendingUp} label="Open Issues" value={String(stats.openCount)} subtitle="tracked" />
        </div>

        {/* Agent Status */}
        <AgentStatusPanel agents={agents} />

        {/* Two-column: Activity + Cost/Decisions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityFeed events={events} />
          <div className="space-y-6">
            <CostBreakdown report={costReport} />
            <DecisionLog decisions={decisions} />
          </div>
        </div>
      </div>
    </div>
  );
}
