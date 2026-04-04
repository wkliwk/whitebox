import { Sidebar } from "@/components/Sidebar";
import { SpendChart } from "@/components/SpendChart";
import { SessionCostTable } from "@/components/SessionCostTable";
import { getProductRepos } from "@/lib/local";
import { getCostHistory, getSessionHistory } from "@/lib/redis";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Costs — Whitebox",
};

export const revalidate = 30;

/** totalSpend and byAgent are in USD cents */
function centsToUsd(cents: number): number {
  return cents / 100;
}

function formatUsd(usd: number): string {
  if (usd >= 1) return `$${usd.toFixed(2)}`;
  if (usd >= 0.001) return `$${usd.toFixed(3)}`;
  return "$0.00";
}

function agentLabel(agentType: string): string {
  return agentType.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default async function CostsPage() {
  const [costHistory, sessionHistory] = await Promise.all([
    getCostHistory(),
    getSessionHistory(),
  ]);

  const repos = getProductRepos();

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  // Summary stats from cost history (cents)
  const todaySnapshot = costHistory.find(s => s.date === today);
  const todayCents = todaySnapshot?.totalSpend ?? 0;

  const weekSnapshots = costHistory.filter(s => s.date >= weekAgo);
  const weekCents = weekSnapshots.reduce((sum, s) => sum + s.totalSpend, 0);

  const monthSnapshots = costHistory.filter(s => s.date >= monthAgo);
  const monthCents = monthSnapshots.reduce((sum, s) => sum + s.totalSpend, 0);

  // Agent leaderboard for this week (from cost history byAgent, cents)
  const agentWeekSpend: Record<string, number> = {};
  for (const snap of weekSnapshots) {
    for (const [agent, spend] of Object.entries(snap.byAgent)) {
      agentWeekSpend[agent] = (agentWeekSpend[agent] ?? 0) + (spend as number);
    }
  }
  const leaderboard = Object.entries(agentWeekSpend)
    .map(([agent, cents]) => ({ agent, cents: cents as number }))
    .sort((a, b) => b.cents - a.cents);

  // Session count per agent (week)
  const agentSessionCount: Record<string, number> = {};
  const weekStart = new Date(weekAgo + "T00:00:00Z").getTime();
  for (const s of sessionHistory) {
    const ts = new Date(s.completedAt).getTime();
    if (ts >= weekStart) {
      agentSessionCount[s.agentType] = (agentSessionCount[s.agentType] ?? 0) + 1;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#111111" }}>
      <Sidebar projects={repos.map(r => ({
        name: r.name,
        url: `https://github.com/${r.owner}/${r.name}`,
      }))} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-8">

          {/* Header */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888] mb-0.5">Costs</div>
            <div className="text-sm text-[#888]">Spending history across all agents and sessions</div>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#222] bg-[#161616] p-5">
              <div className="text-[10px] uppercase tracking-widest text-[#555] mb-1">Today</div>
              <div className="text-2xl font-semibold text-[#e8e8e8]">{formatUsd(centsToUsd(todayCents))}</div>
              {todaySnapshot && Object.keys(todaySnapshot.byAgent).length > 0 && (
                <div className="text-[10px] text-[#555] mt-1">
                  {Object.keys(todaySnapshot.byAgent).length} agent{Object.keys(todaySnapshot.byAgent).length !== 1 ? "s" : ""}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#222] bg-[#161616] p-5">
              <div className="text-[10px] uppercase tracking-widest text-[#555] mb-1">This Week</div>
              <div className="text-2xl font-semibold text-[#e8e8e8]">{formatUsd(centsToUsd(weekCents))}</div>
              <div className="text-[10px] text-[#555] mt-1">
                {weekSnapshots.length} day{weekSnapshots.length !== 1 ? "s" : ""} tracked
              </div>
            </div>

            <div className="rounded-xl border border-[#222] bg-[#161616] p-5">
              <div className="text-[10px] uppercase tracking-widest text-[#555] mb-1">This Month</div>
              <div className="text-2xl font-semibold text-[#e8e8e8]">{formatUsd(centsToUsd(monthCents))}</div>
              <div className="text-[10px] text-[#555] mt-1">
                {monthSnapshots.length} day{monthSnapshots.length !== 1 ? "s" : ""} tracked
              </div>
            </div>
          </div>

          {/* Daily spend chart */}
          <SpendChart snapshots={costHistory} />

          {/* Top sessions table */}
          <SessionCostTable sessions={sessionHistory} />

          {/* Agent leaderboard */}
          <div className="rounded-xl border border-[#222] bg-[#161616] p-5">
            <div className="text-[10px] uppercase tracking-widest text-[#888] font-medium mb-4">
              Agent Leaderboard — This Week
            </div>

            {leaderboard.length === 0 ? (
              <div className="text-xs text-[#555] text-center py-8">No spending data this week</div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map(({ agent, cents }, i) => {
                  const maxCents = leaderboard[0]?.cents ?? 1;
                  const pct = maxCents > 0 ? Math.round((cents / maxCents) * 100) : 0;
                  const sessionCount = agentSessionCount[agent] ?? 0;
                  return (
                    <div key={agent}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#555] font-mono w-4 text-right">{i + 1}</span>
                          <span className="text-[#ccc]">{agentLabel(agent)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[#888] text-[10px]">
                          {sessionCount > 0 && (
                            <span className="text-[#555]">
                              {sessionCount} session{sessionCount !== 1 ? "s" : ""}
                            </span>
                          )}
                          <span className="font-mono">{formatUsd(centsToUsd(cents))}</span>
                        </div>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "#1e1e1e" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: "#4a4a4a" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
