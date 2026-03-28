import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = process.env.GITHUB_OWNER || "wkliwk";
const REPOS = (process.env.PRODUCT_REPOS || "whitebox").split(",").map(r => r.trim());

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
  const tasks: RecentTask[] = [];

  for (const repo of REPOS.slice(0, 5)) {
    try {
      const { data } = await octokit.rest.issues.listForRepo({
        owner: OWNER, repo, state: "open", sort: "updated",
        per_page: 20, direction: "desc",
      });

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
    } catch { /* skip repo */ }
  }

  return tasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 20);
}
