import type { AgentPerformanceSummary } from "@/lib/github";
import { AGENT_COLORS } from "@/lib/agents";

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  const hours = ms / (1000 * 60 * 60);
  if (hours < 1) return `${Math.round(ms / (1000 * 60))}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const days = hours / 24;
  return `${days.toFixed(1)}d`;
}

function formatCost(usd: number): string {
  if (usd === 0) return "—";
  if (usd < 0.01) return "<$0.01";
  return `$${usd.toFixed(2)}`;
}

function agentLabel(agentType: string): string {
  return agentType
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface StatBarProps {
  label: string;
  value: string;
}

function StatBar({ label, value }: StatBarProps) {
  return (
    <div
      className="flex flex-col gap-1 rounded px-4 py-3"
      style={{ background: "#1c1c1c", border: "1px solid #2a2a2a" }}
    >
      <span className="text-xl font-semibold text-[#e8e8e8] leading-none">{value}</span>
      <span className="text-xs text-[#777]">{label}</span>
    </div>
  );
}

interface AgentPerformanceTableProps {
  summary: AgentPerformanceSummary;
}

export function AgentPerformanceTable({ summary }: AgentPerformanceTableProps) {
  const { totalIssuesClosed, avgCloseTimeMs, agents, windowDays } = summary;

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <StatBar
          label={`Issues closed (${windowDays}d)`}
          value={totalIssuesClosed.toString()}
        />
        <StatBar
          label="Avg time to close"
          value={formatDuration(avgCloseTimeMs)}
        />
        <StatBar
          label="Agent types active"
          value={agents.filter(a => a.issuesClosed > 0).length.toString()}
        />
      </div>

      {/* Table */}
      {agents.length === 0 ? (
        <div
          className="rounded px-4 py-8 text-center text-sm text-[#555]"
          style={{ background: "#1a1a1a", border: "1px solid #222" }}
        >
          No closed issues with agent labels in the last {windowDays} days.
        </div>
      ) : (
        <div
          className="rounded overflow-hidden"
          style={{ border: "1px solid #2a2a2a" }}
        >
          {/* Table header */}
          <div
            className="grid text-[10px] uppercase tracking-widest text-[#555] px-4 py-2"
            style={{ gridTemplateColumns: "1fr 80px 100px 80px 90px", background: "#181818", borderBottom: "1px solid #222" }}
          >
            <span>Agent</span>
            <span className="text-right">Closed</span>
            <span className="text-right">Avg close time</span>
            <span className="text-right">Fastest</span>
            <span className="text-right">Est. cost</span>
          </div>

          {/* Rows */}
          {agents.map((agent, i) => {
            const color = AGENT_COLORS[agent.agentType] ?? "#555";
            const isInactive = agent.issuesClosed === 0;
            const rowBg = isInactive ? "#141414" : i % 2 === 0 ? "#1a1a1a" : "#1c1c1c";

            return (
              <div
                key={agent.agentType}
                className="grid items-center px-4 py-3"
                style={{
                  gridTemplateColumns: "1fr 80px 100px 80px 90px",
                  background: rowBg,
                  borderTop: i > 0 ? "1px solid #222" : undefined,
                  opacity: isInactive ? 0.5 : 1,
                }}
              >
                {/* Agent name + color dot */}
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: color }}
                  />
                  <a
                    href={`/issues?agent=${encodeURIComponent(agent.agentType)}`}
                    className="text-xs font-medium hover:underline"
                    style={{ color: isInactive ? "#555" : "#ccc" }}
                  >
                    {agentLabel(agent.agentType)}
                  </a>
                  {isInactive && (
                    <span
                      className="text-[9px] px-1 py-0.5 rounded"
                      style={{ background: "#2a2200", color: "#876" }}
                    >
                      no activity
                    </span>
                  )}
                </div>

                {/* Issues closed */}
                <span
                  className="text-xs text-right font-medium tabular-nums"
                  style={{ color: agent.issuesClosed > 0 ? "#e8e8e8" : "#444" }}
                >
                  {agent.issuesClosed > 0 ? (
                    <a
                      href={`/issues?agent=${encodeURIComponent(agent.agentType)}`}
                      className="hover:underline"
                      style={{ color: "#e8e8e8" }}
                    >
                      {agent.issuesClosed}
                    </a>
                  ) : "0"}
                </span>

                {/* Avg close time */}
                <span className="text-xs text-right tabular-nums" style={{ color: "#888" }}>
                  {formatDuration(agent.avgCloseTimeMs)}
                </span>

                {/* Fastest */}
                <span className="text-xs text-right tabular-nums" style={{ color: "#666" }}>
                  {formatDuration(agent.fastestCloseMs)}
                </span>

                {/* Cost */}
                <span className="text-xs text-right tabular-nums" style={{ color: "#666" }}>
                  {formatCost(agent.totalCostUsd)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-[10px] text-[#444]">
        Data from GitHub API — closed issues with <code className="text-[#555]">agent:*</code> labels in the last {windowDays} days.
        Cost data from Redis session history.
      </div>
    </div>
  );
}
