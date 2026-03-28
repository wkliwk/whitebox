import fs from "fs";
import path from "path";
import os from "os";

const HOME = os.homedir();

function readFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

// ─── Token Usage ─────────────────────────────────────────────────────────────

export interface TokenUsage {
  fiveHourPct: number;
  sevenDayPct: number;
  fiveHourResetsAt: number;
  sevenDayResetsAt: number;
  updatedAt: string;
}

export function getTokenUsage(): TokenUsage | null {
  const raw = readFile(path.join(HOME, ".claude/usage-monitor/usage-cache.json"));
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    return {
      fiveHourPct: d.rate_limits?.five_hour?.used_percentage ?? 0,
      sevenDayPct: d.rate_limits?.seven_day?.used_percentage ?? 0,
      fiveHourResetsAt: d.rate_limits?.five_hour?.resets_at ?? 0,
      sevenDayResetsAt: d.rate_limits?.seven_day?.resets_at ?? 0,
      updatedAt: d.updated_at ?? "",
    };
  } catch {
    return null;
  }
}

// ─── Decisions ───────────────────────────────────────────────────────────────

export interface Decision {
  date: string;
  project: string;
  summary: string;
  prompt?: string;
}

export function getDecisions(limit = 20): Decision[] {
  const raw = readFile(path.join(HOME, "Dev/decisions.jsonl"));
  if (!raw) return [];
  return raw
    .trim()
    .split("\n")
    .filter(Boolean)
    .map(line => {
      try { return JSON.parse(line) as Decision; } catch { return null; }
    })
    .filter((d): d is Decision => d !== null)
    .slice(-limit)
    .reverse();
}

// ─── Loop Log ────────────────────────────────────────────────────────────────

export interface LogEntry {
  timestamp: string;
  product: string;
  action: string;
}

export function getLoopLog(limit = 15): LogEntry[] {
  const raw = readFile(path.join(HOME, "Dev/whitebox/history/loop-log.txt"));
  if (!raw) return [];
  return raw
    .trim()
    .split("\n")
    .filter(Boolean)
    .map(line => {
      const [timestamp, product, ...rest] = line.split(" | ");
      return { timestamp: timestamp?.trim() ?? "", product: product?.trim() ?? "", action: rest.join(" | ").trim() };
    })
    .slice(-limit)
    .reverse();
}

// ─── Agent Activity (derived from decisions.jsonl) ───────────────────────────

export interface AgentActivity {
  project: string;
  lastDate: string;
  lastSummary: string;
  totalEntries: number;
}

export function getAgentActivity(): AgentActivity[] {
  const raw = readFile(path.join(HOME, "Dev/decisions.jsonl"));
  if (!raw) return [];
  const lines = raw.trim().split("\n").filter(Boolean);
  const byProject = new Map<string, { lastDate: string; lastSummary: string; count: number }>();
  for (const line of lines) {
    try {
      const d = JSON.parse(line) as Decision;
      const existing = byProject.get(d.project);
      if (!existing || d.date >= existing.lastDate) {
        byProject.set(d.project, { lastDate: d.date, lastSummary: d.summary, count: (existing?.count ?? 0) + 1 });
      } else {
        byProject.set(d.project, { ...existing, count: existing.count + 1 });
      }
    } catch { /* skip */ }
  }
  return Array.from(byProject.entries())
    .map(([project, v]) => ({ project, lastDate: v.lastDate, lastSummary: v.lastSummary, totalEntries: v.count }))
    .sort((a, b) => b.lastDate.localeCompare(a.lastDate));
}
