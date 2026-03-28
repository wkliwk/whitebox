import { execSync } from "child_process";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import os from "os";
import { NextResponse } from "next/server";
import { Octokit } from "octokit";
import { getProductRepos } from "@/lib/local";
import { getAllHeartbeats } from "@/lib/redis";
import { withCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export interface Session {
  pid: number;
  cpu: number;
  mem: number;
  started: string;
  elapsed: string;
  sessionId: string | null;
  cwd: string | null;
  project: string | null;
  /** Explicit label written by agent via cc-task file */
  label: string | null;
  /** Agent type from line 3 of cc-task file (e.g. "dev", "qa", "pm") */
  agentType: string | null;
  /** Display title — label if set, otherwise auto-derived from flags */
  title: string;
  /** true if title was explicitly set by agent, false if auto-derived */
  titled: boolean;
  flags: string[];
}

/** A task file read directly — used when PID/cwd matching fails */
export interface ActiveTaskFile {
  label: string;
  agentType: string | null;
  project: string;
  /** ISO string of last file modification */
  updatedAt: string;
  /** Age in minutes */
  ageMinutes: number;
}

// Export kept for legacy import compatibility
export interface ActiveTask {
  project: string;
  projectPath: string;
  label: string;
  pid: number | null;
  updatedAt: string;
}

const HOME = os.homedir();

// Keyword → agent id inference for old single-line task files
const AGENT_KEYWORDS: [string, string[]][] = [
  ["ceo",      ["ceo", "strategy", "idea", "evaluate", "approve"]],
  ["pm",       ["pm ", "prd", "product manager", "planning", "issue #", "roadmap"]],
  ["qa",       ["qa", "test", "quality", "review", "analytics"]],
  ["ops",      ["ops", "deploy", "infra", "ci/cd", "release", "pipeline"]],
  ["designer", ["design", "ui", "ux", "figma", "redesign", "visual"]],
  ["finance",  ["finance", "cost", "billing", "budget"]],
  ["dev",      ["build", "implement", "fix", "refactor", "backend", "frontend", "feature"]],
];

function inferAgentType(label: string): string | null {
  const lower = label.toLowerCase();
  for (const [agentId, keywords] of AGENT_KEYWORDS) {
    if (keywords.some(k => lower.includes(k))) return agentId;
  }
  return null;
}

interface TaskEntry {
  label: string;
  agentType: string | null;
  project: string;
  projectPath: string;
  updatedAt: string;
}

function buildTaskMaps(): {
  pidMap: Map<number, TaskEntry>;
  hashMap: Map<string, TaskEntry>;
  allEntries: (TaskEntry & { ageMinutes: number })[];
} {
  const pidMap = new Map<number, TaskEntry>();
  const hashMap = new Map<string, TaskEntry>();
  const allEntries: (TaskEntry & { ageMinutes: number })[] = [];

  // Pre-build hash → projectPath
  const hashToPath = new Map<string, string>();
  try {
    const devDir = path.join(HOME, "Dev");
    for (const entry of fs.readdirSync(devDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const fullPath = path.join(devDir, entry.name);
      const hash = createHash("md5").update(fullPath).digest("hex");
      hashToPath.set(hash, fullPath);
    }
  } catch { /* skip */ }

  try {
    const files = fs.readdirSync("/tmp/claude").filter(f => f.startsWith("cc-task-") && f.endsWith(".txt"));
    for (const file of files) {
      const filePath = `/tmp/claude/${file}`;
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
      const label = lines[0] ?? "";
      if (!label) continue;

      const stat = fs.statSync(filePath);
      const updatedAt = stat.mtime.toISOString();
      const ageMinutes = (Date.now() - stat.mtime.getTime()) / 60000;

      const fileHash = file.replace("cc-task-", "").replace(".txt", "");
      const projectPath = hashToPath.get(fileHash) ?? "";
      const project = projectPath ? path.basename(projectPath) : "";

      // line 3 = explicit agent type (new format); fallback to keyword inference
      const explicitAgentType = lines[2] ?? null;
      const agentType = explicitAgentType || inferAgentType(label);

      const entry: TaskEntry = { label, agentType, project, projectPath, updatedAt };

      // New format: line 2 is PID
      const pid = parseInt(lines[1] ?? "");
      if (!isNaN(pid) && pid > 0) {
        pidMap.set(pid, entry);
      } else {
        hashMap.set(fileHash, entry);
      }

      allEntries.push({ ...entry, ageMinutes });
    }
  } catch { /* /tmp/claude may not exist */ }

  return { pidMap, hashMap, allEntries };
}

/** Fetch recent GitHub activity to infer agent sessions (Vercel fallback) */
async function fetchGitHubActiveTasks(): Promise<ActiveTaskFile[]> {
  if (!process.env.GITHUB_TOKEN) return [];
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const repos = getProductRepos();
  if (repos.length === 0) return [];

  const activeTasks: ActiveTaskFile[] = [];
  const fifteenMinAgo = Date.now() - 15 * 60 * 1000;

  // Strategy 1: Check for issues with in-progress + agent:* labels
  const inProgressResults = await Promise.allSettled(
    repos.map(({ owner, name: repo }) =>
      octokit.rest.issues.listForRepo({
        owner, repo, state: "open", labels: "in-progress", sort: "updated", per_page: 10, direction: "desc",
      }).then(({ data }) => ({ repo, data }))
    )
  );

  const seenAgents = new Set<string>();
  for (const result of inProgressResults) {
    if (result.status !== "fulfilled") continue;
    const { repo, data } = result.value;
    for (const issue of data) {
      const labels = issue.labels.map(l => typeof l === "object" ? l.name || "" : l);
      const agentLabel = labels.find(l => l.startsWith("agent:"));
      if (!agentLabel) continue;
      const agentId = agentLabel.replace("agent:", "");
      // Deduplicate: one entry per agent
      if (seenAgents.has(agentId)) continue;
      seenAgents.add(agentId);

      const updatedAt = issue.updated_at;
      const ageMinutes = Math.round((Date.now() - new Date(updatedAt).getTime()) / 60000);

      activeTasks.push({
        label: `Working on: ${issue.title}`,
        agentType: agentId,
        project: repo,
        updatedAt,
        ageMinutes,
      });
    }
  }

  // Strategy 2: Check recent events across repos for activity in last 15 min
  const eventResults = await Promise.allSettled(
    repos.map(({ owner, name: repo }) =>
      octokit.rest.activity.listRepoEvents({ owner, repo, per_page: 10 })
        .then(({ data }) => ({ repo, data }))
    )
  );

  for (const result of eventResults) {
    if (result.status !== "fulfilled") continue;
    const { repo, data } = result.value;
    for (const event of data) {
      if (!event.created_at) continue;
      const eventTime = new Date(event.created_at).getTime();
      if (eventTime < fifteenMinAgo) continue;

      // Try to infer agent from the event (push events, issue comments, etc.)
      // Only add if we haven't already captured this agent from in-progress issues
      const actorLogin = event.actor?.login ?? "";
      if (actorLogin.includes("bot") || actorLogin.includes("[bot]")) {
        const agentId = "ops";
        if (seenAgents.has(agentId)) continue;
        seenAgents.add(agentId);
        activeTasks.push({
          label: `Recent ${event.type ?? "activity"} in ${repo}`,
          agentType: agentId,
          project: repo,
          updatedAt: event.created_at,
          ageMinutes: Math.round((Date.now() - eventTime) / 60000),
        });
      }
    }
  }

  return activeTasks;
}

export async function GET() {
  try {
    const data = await withCache("sessions", 5000, async () => {
      const { pidMap, allEntries } = buildTaskMaps();

      let sessions: Session[] = [];
      let activeTasks: ActiveTaskFile[] = [];

      // Try local process detection first
      try {
        const out = execSync("ps aux", { timeout: 3000 }).toString();
        const lines = out.trim().split("\n").slice(1);

        for (const line of lines) {
          if (!line.includes(" claude") && !line.startsWith("claude")) continue;
          const cols = line.trim().split(/\s+/);
          if (cols.length < 11) continue;
          const cmdStart = cols.slice(10).join(" ");
          if (!cmdStart.match(/^\/?.*claude(\s|$)/)) continue;
          if (cmdStart.includes("python") || cmdStart.includes("bun") || cmdStart.includes("grep")) continue;

          const pid = parseInt(cols[1]);
          const cpu = parseFloat(cols[2]);
          const mem = parseFloat(cols[3]);
          const started = cols[8];
          const elapsed = cols[9];

          const resumeMatch = cmdStart.match(/--resume\s+([a-f0-9-]{36})/);
          const sessionId = resumeMatch?.[1] ?? null;

          const flags: string[] = [];
          if (cmdStart.includes("--dangerously-skip-permissions")) flags.push("skip-permissions");
          if (cmdStart.includes("--channels")) flags.push("telegram");
          if (sessionId) flags.push("resumed");

          // 1. Try PID-based join (new format)
          const task = pidMap.get(pid) ?? null;

          // Note: lsof cwd lookup removed — all Claude processes report home dir,
          // so hash matching never succeeds. activeTasks covers agent status instead.
          const cwd: string | null = null;

          const project = task?.project ?? null;
          const label = task?.label ?? null;
          const agentType = task?.agentType ?? null;

          let title: string;
          let titled: boolean;
          if (label) {
            title = label;
            titled = true;
          } else {
            if (flags.includes("telegram")) title = "Telegram Worker";
            else if (flags.includes("skip-permissions")) title = "Autonomous Worker";
            else if (sessionId) title = `Resumed Session · ${sessionId.slice(0, 8)}`;
            else title = "Claude Session";
            titled = false;
          }

          sessions.push({ pid, cpu, mem, started, elapsed, sessionId, cwd, project, label, agentType, title, titled, flags });
        }

        sessions.sort((a, b) => b.cpu - a.cpu);

        // Active task files — recent (< 4h) task files surfaced directly for agent status
        activeTasks = allEntries
          .filter(e => e.ageMinutes < 240) // 4 hours
          .map(e => ({
            label: e.label,
            agentType: e.agentType,
            project: e.project,
            updatedAt: e.updatedAt,
            ageMinutes: Math.round(e.ageMinutes),
          }));
      } catch {
        // ps aux failed (expected on Vercel)
      }

      // Redis heartbeat fallback: if no local sessions/tasks found, check heartbeats
      if (sessions.length === 0 && activeTasks.length === 0) {
        const heartbeats = await getAllHeartbeats();
        for (const hb of heartbeats) {
          const ageMinutes = Math.round((Date.now() - new Date(hb.lastPing).getTime()) / 60000);
          activeTasks.push({
            label: hb.task || `${hb.agentType} agent active`,
            agentType: hb.agentType,
            project: hb.project,
            updatedAt: hb.lastPing,
            ageMinutes,
          });
        }

        // GitHub fallback: if Redis also empty and we're on Vercel, try GitHub events
        if (activeTasks.length === 0 && process.env.VERCEL) {
          activeTasks = await fetchGitHubActiveTasks();
        }
      }

      return { sessions, activeTasks, updatedAt: new Date().toISOString() };
    });

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ sessions: [], activeTasks: [], error: String(err), updatedAt: new Date().toISOString() });
  }
}
