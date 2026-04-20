import { getProductRepos } from "./local";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _octokit: any = null;
async function getOctokit() {
  if (!_octokit) {
    const { Octokit } = await import("octokit");
    _octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  }
  return _octokit;
}

export interface RecentTask {
  number: number;
  title: string;
  status: "done" | "in-progress" | "todo";
  priority: "p0" | "p1" | "p2";
  agent?: string;
  updatedAt: string;
  url: string;
  repo: string;
}

/** Returns total open issue count per repo key ("{owner}/{name}"). Silently returns {} on error. */
export async function getOpenIssueCountsForRepos(
  repos: Array<{ owner: string; name: string }>
): Promise<Record<string, number>> {
  if (!process.env.GITHUB_TOKEN || repos.length === 0) return {};
  try {
    const octokit = await getOctokit();
    const results = await Promise.allSettled(
      repos.map(({ owner, name }) =>
        octokit.rest.repos.get({ owner, repo: name })
          .then(({ data }: { data: { open_issues_count: number } }) => ({
            key: `${owner}/${name}`,
            count: data.open_issues_count,
          }))
      )
    );
    const counts: Record<string, number> = {};
    for (const r of results) {
      if (r.status === "fulfilled") counts[r.value.key] = r.value.count;
    }
    return counts;
  } catch {
    return {};
  }
}

export interface PullRequest {
  number: number;
  title: string;
  repo: string;
  owner: string;
  url: string;
  draft: boolean;
  reviewComments: number;
  updatedAt: string;
  createdAt: string;
  author: string;
}

export async function getOpenPRs(): Promise<PullRequest[]> {
  if (!process.env.GITHUB_TOKEN) return [];

  const octokit = await getOctokit();
  const repos = getProductRepos();
  const prs: PullRequest[] = [];

  const results = await Promise.allSettled(
    repos.map(({ owner, name: repo }) =>
      octokit.rest.pulls.list({ owner, repo, state: "open", sort: "updated", direction: "desc", per_page: 20 })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(({ data }: { data: any[] }) => ({ owner, repo, data }))
    )
  );

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { owner, repo, data } = result.value;
    for (const pr of data) {
      prs.push({
        number: pr.number,
        title: pr.title,
        repo,
        owner,
        url: pr.html_url,
        draft: pr.draft ?? false,
        reviewComments: pr.review_comments ?? 0,
        updatedAt: pr.updated_at,
        createdAt: pr.created_at,
        author: pr.user?.login ?? "",
      });
    }
  }

  return prs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

// ─── Agent Performance Metrics ───────────────────────────────────────────────

export interface AgentPerformanceMetric {
  agentType: string;
  issuesClosed: number;
  avgCloseTimeMs: number | null;  // null when no issues closed
  fastestCloseMs: number | null;
  /** Sum of costUsd from Redis session history for this agent type */
  totalCostUsd: number;
}

export interface AgentPerformanceSummary {
  totalIssuesClosed: number;
  avgCloseTimeMs: number | null;
  agents: AgentPerformanceMetric[];
  windowDays: number;
}

/**
 * Fetches recently closed issues across all product repos with `agent:*` labels.
 * Groups them by agent type and computes performance metrics.
 */
export async function getAgentPerformanceMetrics(
  windowDays = 7
): Promise<AgentPerformanceSummary> {
  if (!process.env.GITHUB_TOKEN) {
    return { totalIssuesClosed: 0, avgCloseTimeMs: null, agents: [], windowDays };
  }

  const octokit = await getOctokit();
  const { getProductRepos } = await import("./local");
  const repos = getProductRepos();

  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  // Fetch closed issues from all repos in the time window
  const results = await Promise.allSettled(
    repos.map(({ owner, name: repo }) =>
      octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: "closed",
        sort: "updated",
        direction: "desc",
        since,
        per_page: 100,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }).then(({ data }: { data: any[] }) => ({ owner, repo, data }))
    )
  );

  // Group close times by agent type
  const agentCloseTimes = new Map<string, number[]>();

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { data } = result.value;
    for (const issue of data) {
      // Skip pull requests
      if (issue.pull_request) continue;
      // Must have been closed within window
      if (!issue.closed_at) continue;
      const closedAt = new Date(issue.closed_at).getTime();
      if (closedAt < Date.now() - windowDays * 24 * 60 * 60 * 1000) continue;

      // Find agent label
      const labels: string[] = (issue.labels ?? []).map((l: { name?: string } | string) =>
        typeof l === "object" ? (l.name ?? "") : l
      );
      const agentLabel = labels.find(l => l.startsWith("agent:"));
      if (!agentLabel) continue;

      const agentType = agentLabel.replace("agent:", "");
      const createdAt = new Date(issue.created_at).getTime();
      const closeTimeMs = closedAt - createdAt;

      if (!agentCloseTimes.has(agentType)) agentCloseTimes.set(agentType, []);
      agentCloseTimes.get(agentType)!.push(closeTimeMs);
    }
  }

  // Build per-agent metrics (session cost data merged in caller via Redis)
  const agents: AgentPerformanceMetric[] = Array.from(agentCloseTimes.entries()).map(([agentType, times]) => {
    const issuesClosed = times.length;
    const avgCloseTimeMs = times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : null;
    const fastestCloseMs = times.length > 0 ? Math.min(...times) : null;
    return { agentType, issuesClosed, avgCloseTimeMs, fastestCloseMs, totalCostUsd: 0 };
  });

  // Sort by issues closed descending
  agents.sort((a, b) => b.issuesClosed - a.issuesClosed);

  const totalIssuesClosed = agents.reduce((sum, a) => sum + a.issuesClosed, 0);
  const allTimes = agents.flatMap(a =>
    agentCloseTimes.get(a.agentType) ?? []
  );
  const avgCloseTimeMs = allTimes.length > 0
    ? Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length)
    : null;

  return { totalIssuesClosed, avgCloseTimeMs, agents, windowDays };
}

function parseIssueToTask(issue: any, repo: string, forceStatus?: RecentTask["status"]): RecentTask | null {
  if (issue.pull_request) return null;
  const labels = issue.labels.map((l: any) => typeof l === "object" ? l.name || "" : l) as string[];
  let status: RecentTask["status"] = forceStatus ?? "todo";
  if (!forceStatus && labels.some((l: string) => l.includes("in-progress"))) status = "in-progress";
  let priority: RecentTask["priority"] = "p2";
  if (labels.some((l: string) => l.includes("p0"))) priority = "p0";
  else if (labels.some((l: string) => l.includes("p1"))) priority = "p1";
  const agentLabel = labels.find((l: string) => l.startsWith("agent:"));
  const agent = agentLabel?.replace("agent:", "");
  return { number: issue.number, title: issue.title, status, priority, agent, updatedAt: issue.updated_at, url: issue.html_url, repo };
}

export async function getRecentTasks(): Promise<RecentTask[]> {
  if (!process.env.GITHUB_TOKEN) return [];

  const octokit = await getOctokit();
  const repos = getProductRepos();

  // Fetch open and recently closed issues in parallel across all repos
  const [openResults, closedResults] = await Promise.all([
    Promise.allSettled(
      repos.map(({ owner, name: repo }) =>
        octokit.rest.issues.listForRepo({ owner, repo, state: "open", sort: "updated", per_page: 10, direction: "desc" })
          .then(({ data }: { data: any[] }) => ({ repo, data }))
      )
    ),
    Promise.allSettled(
      repos.map(({ owner, name: repo }) =>
        octokit.rest.issues.listForRepo({ owner, repo, state: "closed", sort: "updated", per_page: 10, direction: "desc" })
          .then(({ data }: { data: any[] }) => ({ repo, data }))
      )
    ),
  ]);

  const openTasks: RecentTask[] = [];
  for (const result of openResults) {
    if (result.status !== "fulfilled") continue;
    const { repo, data } = result.value;
    for (const issue of data) {
      const task = parseIssueToTask(issue, repo);
      if (task) openTasks.push(task);
    }
  }

  const closedTasks: RecentTask[] = [];
  for (const result of closedResults) {
    if (result.status !== "fulfilled") continue;
    const { repo, data } = result.value;
    for (const issue of data) {
      const task = parseIssueToTask(issue, repo, "done");
      if (task) closedTasks.push(task);
    }
  }

  const sorted = (arr: RecentTask[]) =>
    arr.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const cap = Math.max(repos.length * 10, 30);
  return [...sorted(openTasks), ...sorted(closedTasks)].slice(0, cap);
}
