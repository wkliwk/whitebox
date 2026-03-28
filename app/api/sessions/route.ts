import { execSync } from "child_process";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import os from "os";
import { NextResponse } from "next/server";

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

export async function GET() {
  try {
    const { pidMap, hashMap, allEntries } = buildTaskMaps();

    const out = execSync("ps aux", { timeout: 3000 }).toString();
    const lines = out.trim().split("\n").slice(1);
    const sessions: Session[] = [];

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
      let task = pidMap.get(pid) ?? null;

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
    // This covers the common case where lsof cwd = home and PID matching fails
    const activeTasks: ActiveTaskFile[] = allEntries
      .filter(e => e.ageMinutes < 240) // 4 hours
      .map(e => ({
        label: e.label,
        agentType: e.agentType,
        project: e.project,
        updatedAt: e.updatedAt,
        ageMinutes: Math.round(e.ageMinutes),
      }));

    return NextResponse.json({ sessions, activeTasks, updatedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ sessions: [], activeTasks: [], error: String(err), updatedAt: new Date().toISOString() });
  }
}
