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

export async function getRecentTasks(): Promise<RecentTask[]> {
  if (!process.env.GITHUB_TOKEN) return [];

  const octokit = await getOctokit();
  const repos = getProductRepos();
  const tasks: RecentTask[] = [];

  // Fetch all repos in parallel
  const results = await Promise.allSettled(
    repos.map(({ owner, name: repo }) =>
      octokit.rest.issues.listForRepo({ owner, repo, state: "open", sort: "updated", per_page: 20, direction: "desc" })
        .then(({ data }: { data: any[] }) => ({ repo, data }))
    )
  );

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { repo, data } = result.value;
    for (const issue of data) {
      if (issue.pull_request) continue;
      const labels = issue.labels.map((l: any) => typeof l === "object" ? l.name || "" : l) as string[];
      let status: RecentTask["status"] = "todo";
      if (labels.some((l: string) => l.includes("in-progress"))) status = "in-progress";
      let priority: RecentTask["priority"] = "p2";
      if (labels.some((l: string) => l.includes("p0"))) priority = "p0";
      else if (labels.some((l: string) => l.includes("p1"))) priority = "p1";
      const agentLabel = labels.find((l: string) => l.startsWith("agent:"));
      const agent = agentLabel?.replace("agent:", "");
      tasks.push({ number: issue.number, title: issue.title, status, priority, agent, updatedAt: issue.updated_at, url: issue.html_url, repo });
    }
  }

  return tasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 20);
}
