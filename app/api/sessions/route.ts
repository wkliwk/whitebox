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

// Export kept for legacy import compatibility
export interface ActiveTask {
  project: string;
  projectPath: string;
  label: string;
  pid: number | null;
  updatedAt: string;
}

const HOME = os.homedir();

interface TaskEntry {
  label: string;
  agentType: string | null;
  project: string;
  projectPath: string;
  updatedAt: string;
}

/**
 * Returns two maps:
 * - pidMap: PID → TaskEntry (new format: line 1 = label, line 2 = PID)
 * - hashMap: md5(path) → TaskEntry (old/fallback format: line 1 = label only)
 */
function buildTaskMaps(): {
  pidMap: Map<number, TaskEntry>;
  hashMap: Map<string, TaskEntry>;
} {
  const pidMap = new Map<number, TaskEntry>();
  const hashMap = new Map<string, TaskEntry>();

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

      const fileHash = file.replace("cc-task-", "").replace(".txt", "");
      const projectPath = hashToPath.get(fileHash) ?? "";
      const project = projectPath ? path.basename(projectPath) : "";

      // line 3 = agent type (new format), may be absent
      const agentType = lines[2] ?? null;
      const entry: TaskEntry = { label, agentType, project, projectPath, updatedAt };

      // New format: line 2 is PID
      const pid = parseInt(lines[1] ?? "");
      if (!isNaN(pid) && pid > 0) {
        pidMap.set(pid, entry);
      } else {
        // Old format: store by path hash for cwd-based fallback
        hashMap.set(fileHash, entry);
      }
    }
  } catch { /* /tmp/claude may not exist */ }

  return { pidMap, hashMap };
}

export async function GET() {
  try {
    const { pidMap, hashMap } = buildTaskMaps();

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

      // 2. Fall back to cwd hash (old format, single-line task files)
      if (!task) {
        let cwd2: string | null = null;
        try {
          const cwdOut2 = execSync(`lsof -p ${pid} -a -d cwd -Fn 2>/dev/null`, { timeout: 1500 }).toString();
          const m = cwdOut2.match(/^n(.+)$/m);
          cwd2 = m?.[1] ?? null;
        } catch { /* skip */ }
        if (cwd2 && cwd2 !== HOME && cwd2 !== `${HOME}/`) {
          const cwdHash = createHash("md5").update(cwd2).digest("hex");
          task = hashMap.get(cwdHash) ?? null;
        }
      }

      const project = task?.project ?? null;
      const label = task?.label ?? null;
      const agentType = task?.agentType ?? null;

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

      // cwd already fetched above during fallback; re-use if available
      const cwd: string | null = (() => {
        try {
          const cwdOut = execSync(`lsof -p ${pid} -a -d cwd -Fn 2>/dev/null`, { timeout: 1000 }).toString();
          return cwdOut.match(/^n(.+)$/m)?.[1] ?? null;
        } catch { return null; }
      })();

      sessions.push({ pid, cpu, mem, started, elapsed, sessionId, cwd, project, label, agentType, title, titled, flags });
    }

    sessions.sort((a, b) => b.cpu - a.cpu);
    return NextResponse.json({ sessions, updatedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ sessions: [], error: String(err), updatedAt: new Date().toISOString() });
  }
}
