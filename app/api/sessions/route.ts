import { execSync } from "child_process";
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
  flags: string[];
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

export async function GET() {
  try {
    const out = execSync("ps aux", { timeout: 3000 }).toString();
    const lines = out.trim().split("\n").slice(1); // skip header

    const sessions: Session[] = [];

    for (const line of lines) {
      // Only match actual claude CLI processes (not grep, bun, python)
      if (!line.includes(" claude") && !line.startsWith("claude")) continue;
      const cols = line.trim().split(/\s+/);
      // cols: USER PID %CPU %MEM VSZ RSS TT STAT STARTED TIME COMMAND...
      if (cols.length < 11) continue;
      const cmdStart = cols.slice(10).join(" ");
      if (!cmdStart.match(/^\/?.*claude(\s|$)/)) continue;
      // Skip non-claude-CLI processes
      if (cmdStart.includes("python") || cmdStart.includes("bun") || cmdStart.includes("grep")) continue;

      const pid = parseInt(cols[1]);
      const cpu = parseFloat(cols[2]);
      const mem = parseFloat(cols[3]);
      const started = cols[8];
      const elapsed = cols[9];

      // Parse --resume <uuid>
      const resumeMatch = cmdStart.match(/--resume\s+([a-f0-9-]{36})/);
      const sessionId = resumeMatch?.[1] ?? null;

      // Parse useful flags
      const flags: string[] = [];
      if (cmdStart.includes("--dangerously-skip-permissions")) flags.push("skip-permissions");
      if (cmdStart.includes("--channels")) flags.push("telegram");
      if (sessionId) flags.push("resumed");

      const cwd = getCwd(pid);

      sessions.push({ pid, cpu, mem, started, elapsed, sessionId, cwd, flags });
    }

    // Sort by CPU desc (most active first)
    sessions.sort((a, b) => b.cpu - a.cpu);

    return NextResponse.json({ sessions, updatedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ sessions: [], error: String(err), updatedAt: new Date().toISOString() });
  }
}
