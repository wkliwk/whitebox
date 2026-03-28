import { Octokit } from "octokit";
import { getProductRepos } from "./local";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

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

export async function getRecentTasks(): Promise<RecentTask[]> {
  if (!process.env.GITHUB_TOKEN) return [];

  const repos = getProductRepos();
  const tasks: RecentTask[] = [];

  // Fetch all repos in parallel
  const results = await Promise.allSettled(
    repos.map(({ owner, name: repo }) =>
      octokit.rest.issues.listForRepo({ owner, repo, state: "open", sort: "updated", per_page: 20, direction: "desc" })
        .then(({ data }) => ({ repo, data }))
    )
  );

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { repo, data } = result.value;
    for (const issue of data) {
      if (issue.pull_request) continue;
      const labels = issue.labels.map(l => typeof l === "object" ? l.name || "" : l);
      let status: RecentTask["status"] = "todo";
      if (labels.some(l => l.includes("in-progress"))) status = "in-progress";
      let priority: RecentTask["priority"] = "p2";
      if (labels.some(l => l.includes("p0"))) priority = "p0";
      else if (labels.some(l => l.includes("p1"))) priority = "p1";
      const agentLabel = labels.find(l => l.startsWith("agent:"));
      const agent = agentLabel?.replace("agent:", "");
      tasks.push({ number: issue.number, title: issue.title, status, priority, agent, updatedAt: issue.updated_at, url: issue.html_url, repo });
    }
  }

  return tasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 20);
}
