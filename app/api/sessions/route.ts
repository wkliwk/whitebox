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
  /** Display title — label if set, otherwise auto-derived from flags */
  title: string;
  /** true if title was explicitly set by agent, false if auto-derived */
  titled: boolean;
  flags: string[];
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

/**
 * Build a map of PID → { label, project, projectPath, updatedAt } from /tmp/claude/cc-task-*.txt
 * Each file has two lines: line 1 = label, line 2 = PID (written by status-line command).
 * Falls back to md5-hash matching for files that only have one line (old format).
 */
function buildPidTaskMap(): Map<number, { label: string; project: string; projectPath: string; updatedAt: string }> {
  const pidMap = new Map<number, { label: string; project: string; projectPath: string; updatedAt: string }>();

  // Pre-build hash → projectPath for old-format files
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
      const pidStr = lines[1] ?? "";
      const stat = fs.statSync(filePath);
      const updatedAt = stat.mtime.toISOString();

      // Resolve project name via hash in filename
      const hash = file.replace("cc-task-", "").replace(".txt", "");
      const projectPath = hashToPath.get(hash) ?? "";
      const project = projectPath ? path.basename(projectPath) : hash.slice(0, 8);

      const pid = parseInt(pidStr);
      if (!isNaN(pid) && pid > 0) {
        pidMap.set(pid, { label, project, projectPath, updatedAt });
      }
    }
  } catch { /* /tmp/claude may not exist */ }

  return pidMap;
}

export async function GET() {
  try {
    const pidTaskMap = buildPidTaskMap();

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

      // Direct PID-based join
      const task = pidTaskMap.get(pid) ?? null;
      const project = task?.project ?? null;
      const label = task?.label ?? null;

      // Derive display title
      let title: string;
      let titled: boolean;
      if (label) {
        title = label;
        titled = true;
      } else {
        // Auto-derive from flags / sessionId
        if (flags.includes("telegram")) title = "Telegram Worker";
        else if (flags.includes("skip-permissions")) title = "Autonomous Worker";
        else if (sessionId) title = `Resumed Session · ${sessionId.slice(0, 8)}`;
        else title = "Claude Session";
        titled = false;
      }

      // Try to get cwd for display only (not for matching)
      let cwd: string | null = null;
      try {
        const cwdOut = execSync(`lsof -p ${pid} -a -d cwd -Fn 2>/dev/null`, { timeout: 1500 }).toString();
        const match = cwdOut.match(/^n(.+)$/m);
        cwd = match?.[1] ?? null;
      } catch { /* skip */ }

      sessions.push({ pid, cpu, mem, started, elapsed, sessionId, cwd, project, label, title, titled, flags });
    }

    sessions.sort((a, b) => b.cpu - a.cpu);
    return NextResponse.json({ sessions, updatedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ sessions: [], error: String(err), updatedAt: new Date().toISOString() });
  }
}
