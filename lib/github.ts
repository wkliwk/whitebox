import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = process.env.GITHUB_OWNER || "wkliwk";
const REPO = process.env.GITHUB_REPO || "ai-company";

export interface GitHubEvent {
  agent: string;
  verb: string;
  entityType: string;
  entityRef: string;
  entityTitle: string;
  timestamp: string;
}

export interface ProjectItem {
  number: number;
  title: string;
  status: string;
  labels: string[];
  assignees: string[];
  url: string;
  updatedAt: string;
}

export async function getRecentEvents(): Promise<GitHubEvent[]> {
  try {
    const repos = (process.env.PRODUCT_REPOS || REPO).split(",").map(r => r.trim());
    const allEvents: GitHubEvent[] = [];

    for (const repo of repos.slice(0, 3)) {
      const { data } = await octokit.rest.activity.listRepoEvents({
        owner: OWNER, repo, per_page: 30,
      });

      for (const event of data) {
        let verb = "", entityType = "", entityRef = "", entityTitle = "";
        const payload = event.payload as Record<string, unknown>;

        if (event.type === "PullRequestEvent") {
          const action = payload.action as string;
          const pr = payload.pull_request as Record<string, unknown>;
          entityRef = `#${(pr.number as number)}`;
          entityTitle = pr.title as string;
          entityType = "PR";
          if (action === "opened") verb = "opened PR";
          else if (action === "closed" && pr.merged) verb = "merged PR";
          else continue;
        } else if (event.type === "IssuesEvent") {
          const action = payload.action as string;
          const issue = payload.issue as Record<string, unknown>;
          entityRef = `#${(issue.number as number)}`;
          entityTitle = issue.title as string;
          entityType = "issue";
          if (action === "opened") verb = "created issue";
          else if (action === "closed") verb = "closed";
          else continue;
        } else if (event.type === "PushEvent") {
          const commits = payload.commits as unknown[];
          verb = "pushed";
          entityRef = `${commits?.length || 0} commits`;
          entityTitle = `to ${(payload.ref as string)?.replace("refs/heads/", "")}`;
          entityType = "push";
        } else {
          continue;
        }

        // Map actor to agent label
        const actor = event.actor?.login || "";
        const agent = actor === OWNER ? "founder" : actor;

        allEvents.push({ agent, verb, entityType, entityRef, entityTitle, timestamp: event.created_at || "" });
      }
    }

    return allEvents.slice(0, 15);
  } catch {
    return [];
  }
}

export async function getIssueStats() {
  try {
    const { data: open } = await octokit.rest.issues.listForRepo({
      owner: OWNER, repo: REPO, state: "open", per_page: 100,
    });
    const inProgress = open.filter(i => i.labels.some(l => (typeof l === "object" ? l.name : l)?.includes("in-progress")));
    return { openCount: open.length, inProgressCount: inProgress.length };
  } catch {
    return { openCount: 0, inProgressCount: 0 };
  }
}

export async function getCostReport() {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: OWNER, repo: REPO, path: "costs.json",
    });
    if ("content" in data) {
      const content = Buffer.from(data.content, "base64").toString();
      return JSON.parse(content);
    }
    return null;
  } catch {
    return null;
  }
}

export async function getDecisions() {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: OWNER, repo: REPO, path: "decisions.jsonl",
    });
    if ("content" in data) {
      const content = Buffer.from(data.content, "base64").toString();
      return content.trim().split("\n").filter(Boolean).map(l => JSON.parse(l)).slice(-10).reverse();
    }
    return [];
  } catch {
    return [];
  }
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

export async function getRecentTasks(): Promise<RecentTask[]> {
  const repos = (process.env.PRODUCT_REPOS || REPO).split(",").map(r => r.trim());
  const tasks: RecentTask[] = [];

  for (const repo of repos.slice(0, 3)) {
    try {
      const { data } = await octokit.rest.issues.listForRepo({
        owner: OWNER, repo, state: "all", sort: "updated",
        per_page: 20, direction: "desc",
      });

      for (const issue of data) {
        if (issue.pull_request) continue;
        const labels = issue.labels.map(l => typeof l === "object" ? l.name || "" : l);

        let status: RecentTask["status"] = "todo";
        if (issue.state === "closed") status = "done";
        else if (labels.some(l => l.includes("in-progress"))) status = "in-progress";

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

export async function getAgentActivity() {
  const { AGENTS } = await import("./agents");
  const results = [];
  for (const agent of AGENTS) {
    try {
      const repos = (process.env.PRODUCT_REPOS || REPO).split(",").map(r => r.trim());
      let currentTask = null;
      let lastActive = "";
      let completedCount = 0;

      for (const repo of repos.slice(0, 3)) {
        const { data } = await octokit.rest.issues.listForRepo({
          owner: OWNER, repo, state: "all", labels: agent.githubLabel,
          sort: "updated", per_page: 20,
        });
        for (const issue of data) {
          if (issue.state === "open") {
            const isInProgress = issue.labels.some(l => (typeof l === "object" ? l.name : l)?.includes("in-progress"));
            if (isInProgress && !currentTask) {
              currentTask = { title: issue.title, number: issue.number, url: issue.html_url, repo };
            }
          } else {
            completedCount++;
          }
          if (!lastActive || new Date(issue.updated_at) > new Date(lastActive)) {
            lastActive = issue.updated_at;
          }
        }
      }

      results.push({ ...agent, currentTask, lastActive, completedCount, status: currentTask ? "running" : "idle" });
    } catch {
      results.push({ ...agent, currentTask: null, lastActive: "", completedCount: 0, status: "idle" });
    }
  }
  return results;
}
