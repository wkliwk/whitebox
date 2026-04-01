/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs") as typeof import("fs");
const path = require("path") as typeof import("path");
const os = require("os") as typeof import("os");
import { NextResponse } from "next/server";
import type { AgentDef } from "@/lib/agents";

export const dynamic = "force-dynamic";

const KNOWN_COLORS: Record<string, string> = {
  ceo: "#8b5cf6", pm: "#3b82f6", "frontend-dev": "#06b6d4", "backend-dev": "#0ea5e9",
  "mobile-dev": "#14b8a6", qa: "#22c55e", ops: "#eab308", designer: "#ec4899",
  finance: "#6366f1", "ai-researcher": "#f97316", "claude-code-manager": "#a855f7",
};

function displayName(id: string): string {
  return id.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function loadAgents(): AgentDef[] {
  const agentsDir = path.join(os.homedir(), ".claude/agents");
  let files: string[];
  try { files = fs.readdirSync(agentsDir).filter(f => f.endsWith(".md") && f !== "README.md"); }
  catch { return []; }

  return files.map(file => {
    const id = file.replace(/\.md$/, "");
    const content = fs.readFileSync(path.join(agentsDir, file), "utf-8");
    let description = "", category = "";
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
      const fm = fmMatch[1];
      description = fm.match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? "";
      category = fm.match(/^category:\s*(.+)$/m)?.[1]?.trim() ?? "";
    }
    return { id, name: displayName(id), description, category, color: KNOWN_COLORS[id] ?? "#555", githubLabel: `agent:${id}` };
  }).sort((a, b) => {
    const catOrder = ["Leadership", "Engineering", "Quality", "Operations"];
    const ai = catOrder.indexOf(a.category), bi = catOrder.indexOf(b.category);
    if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return a.id.localeCompare(b.id);
  });
}

export async function GET() {
  const agents = loadAgents();
  // Merge last-task data from Redis (production only — Redis not available in local dev without env vars)
  try {
    const { getAgentLastTasks } = await import("@/lib/redis");
    const lastTasks = await getAgentLastTasks();
    if (Object.keys(lastTasks).length > 0) {
      for (const agent of agents) {
        if (lastTasks[agent.id]) agent.lastTask = lastTasks[agent.id];
      }
    }
  } catch { /* no Redis — return without lastTask */ }
  return NextResponse.json({ agents });
}
