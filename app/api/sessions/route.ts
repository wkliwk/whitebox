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
  description: string | null;
  flags: string[];
}

const HOME = os.homedir();

// Build map of md5(path) → { path, label } from /tmp/claude/cc-task-*.txt
function buildTaskLabelMap(): Map<string, { projectPath: string; label: string }> {
  const map = new Map<string, { projectPath: string; label: string }>();
  try {
    const files = fs.readdirSync("/tmp/claude").filter(f => f.startsWith("cc-task-") && f.endsWith(".txt"));
    for (const file of files) {
      const hash = file.replace("cc-task-", "").replace(".txt", "");
      const label = fs.readFileSync(`/tmp/claude/${file}`, "utf-8").trim();
      map.set(hash, { projectPath: "", label });
    }
  } catch { /* /tmp/claude may not exist */ }

  // Now try to resolve projectPath by hashing known dev dirs
  try {
    const devDir = path.join(HOME, "Dev");
    const entries = fs.readdirSync(devDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const fullPath = path.join(devDir, entry.name);
      const hash = createHash("md5").update(fullPath).digest("hex");
      if (map.has(hash)) {
        map.set(hash, { projectPath: fullPath, label: map.get(hash)!.label });
      }
    }
  } catch { /* skip */ }

  return map;
}

// Use lsof to find open files in ~/Dev — infer project dir
function inferProjectFromOpenFiles(pid: number): string | null {
  try {
    const out = execSync(
      `lsof -p ${pid} 2>/dev/null | grep "${HOME}/Dev/" | grep -v node_modules | grep -v ".next" | awk '{print $9}' | head -5`,
      { timeout: 2000 }
    ).toString();
    const devPath = path.join(HOME, "Dev") + "/";
    for (const line of out.trim().split("\n")) {
      if (!line.startsWith(devPath)) continue;
      const rel = line.slice(devPath.length);
      const projectName = rel.split("/")[0];
      if (projectName) return path.join(devPath, projectName);
    }
    return null;
  } catch {
    return null;
  }
}

function getCwd(pid: number): string | null {
  try {
    const out = execSync(`lsof -p ${pid} -a -d cwd -Fn 2>/dev/null`, { timeout: 2000 }).toString();
    const match = out.match(/^n(.+)$/m);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export interface ActiveTask {
  project: string;
  projectPath: string;
  label: string;
  updatedAt: string;
}

function getActiveTasks(): ActiveTask[] {
  const tasks: ActiveTask[] = [];
  try {
    const files = fs.readdirSync("/tmp/claude").filter(f => f.startsWith("cc-task-") && f.endsWith(".txt"));
    const devDir = path.join(HOME, "Dev");
    // Pre-build hash → projectPath map
    const hashToPath = new Map<string, string>();
    try {
      for (const entry of fs.readdirSync(devDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const fullPath = path.join(devDir, entry.name);
        const hash = createHash("md5").update(fullPath).digest("hex");
        hashToPath.set(hash, fullPath);
      }
    } catch { /* skip */ }

    for (const file of files) {
      const hash = file.replace("cc-task-", "").replace(".txt", "");
      const filePath = `/tmp/claude/${file}`;
      const label = fs.readFileSync(filePath, "utf-8").trim();
      const stat = fs.statSync(filePath);
      const projectPath = hashToPath.get(hash) ?? "";
      const project = projectPath ? path.basename(projectPath) : hash.slice(0, 8);
      tasks.push({ project, projectPath, label, updatedAt: stat.mtime.toISOString() });
    }
  } catch { /* /tmp/claude may not exist */ }

  return tasks.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function GET() {
  try {
    const taskLabels = buildTaskLabelMap();

    // Build reverse map: projectPath → label
    const pathToLabel = new Map<string, string>();
    for (const { projectPath, label } of taskLabels.values()) {
      if (projectPath) pathToLabel.set(projectPath, label);
    }

    const activeTasks = getActiveTasks();
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

      const cwd = getCwd(pid);

      // Resolve project + description
      let project: string | null = null;
      let description: string | null = null;

      // 1. Try cwd hash — but skip if cwd is home dir (not meaningful)
      const isHomeCwd = cwd === HOME || cwd === `${HOME}/`;
      if (cwd && !isHomeCwd) {
        const cwdHash = createHash("md5").update(cwd).digest("hex");
        const entry = taskLabels.get(cwdHash);
        if (entry) {
          project = path.basename(cwd);
          description = entry.label;
        }
      }

      // 2. Try inferred project from open files in ~/Dev
      if (!description) {
        const inferredPath = inferProjectFromOpenFiles(pid);
        if (inferredPath) {
          project = path.basename(inferredPath);
          description = pathToLabel.get(inferredPath) ?? null;
        }
      }

      sessions.push({ pid, cpu, mem, started, elapsed, sessionId, cwd, project, description, flags });
    }

    sessions.sort((a, b) => b.cpu - a.cpu);
    return NextResponse.json({ sessions, activeTasks, updatedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ sessions: [], error: String(err), updatedAt: new Date().toISOString() });
  }
}
