/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs") as typeof import("fs");
const path = require("path") as typeof import("path");
const os = require("os") as typeof import("os");

const HOME = os.homedir();

// ─── GitHub Fallback Helper ─────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _octokitInstance: any = null;
async function getOctokit() {
  if (!process.env.GITHUB_TOKEN) return null;
  if (!_octokitInstance) {
    const { Octokit } = await import("octokit");
    _octokitInstance = new Octokit({ auth: process.env.GITHUB_TOKEN });
  }
  return _octokitInstance;
}

async function fetchDecisionsFromGitHub(): Promise<string | null> {
  const octokit = await getOctokit();
  if (!octokit) return null;
  const owner = process.env.GITHUB_OWNER?.trim();
  const repo = process.env.GITHUB_REPO?.trim();
  if (!owner || !repo) return null;
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner, repo, path: "decisions.jsonl",
    });
    if ("content" in data && typeof data.content === "string") {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return null;
  } catch {
    return null;
  }
}

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

function parseDecisions(raw: string, limit: number): Decision[] {
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

export async function getDecisions(limit = 20): Promise<Decision[]> {
  const raw = readFile(path.join(HOME, "Dev/decisions.jsonl"));
  if (raw) return parseDecisions(raw, limit);
  // Fallback: fetch from GitHub
  const ghRaw = await fetchDecisionsFromGitHub();
  if (ghRaw) return parseDecisions(ghRaw, limit);
  return [];
}

// ─── Loop Log ────────────────────────────────────────────────────────────────

export interface LogEntry {
  timestamp: string;
  product: string;
  action: string;
  level: "info" | "warn" | "error" | "debug";
  agent?: string;
}

function classifyLevel(action: string): LogEntry["level"] {
  const lower = action.toLowerCase();
  if (/error|failed|exception|crash|fatal/.test(lower)) return "error";
  if (/warn|blocked|skipped|rate.?limit|circuit.?breaker|deferred/.test(lower)) return "warn";
  if (/debug|verbose/.test(lower)) return "debug";
  return "info";
}

export interface LoopLogResult {
  entries: LogEntry[];
  total: number;
  totalErrors: number;
}

export async function getLoopLog(limit = 50): Promise<LoopLogResult> {
  // In production, read from Redis (pushed by local machine via push-loop-event.sh)
  if (process.env.NODE_ENV === "production") {
    const { getLoopEvents } = await import("./redis");
    const result = await getLoopEvents(limit, 0);
    return { entries: result.events, total: result.total, totalErrors: result.totalErrors };
  }
  // Local dev: read file directly
  const raw = readFile(path.join(HOME, "Dev/whitebox/history/loop-log.txt"));
  if (!raw) return { entries: [], total: 0, totalErrors: 0 };
  const parsed = raw
    .trim()
    .split("\n")
    .filter(Boolean)
    .map(line => {
      const parts = line.split(" | ");
      if (parts.length >= 3) {
        const timestamp = parts[0]?.trim() ?? "";
        const product = parts[1]?.trim() ?? "";
        const action = parts.slice(2).join(" | ").trim();
        return { timestamp, product, action, level: classifyLevel(action) };
      }
      if (parts.length === 2) {
        const timestamp = parts[0]?.trim() ?? "";
        const action = parts[1]?.trim() ?? "";
        return { timestamp, product: "", action, level: classifyLevel(action) };
      }
      return { timestamp: "", product: "", action: line.trim(), level: "debug" as const };
    })
    .slice(-limit)
    .reverse();
  return { entries: parsed, total: parsed.length, totalErrors: parsed.filter((e: LogEntry) => e.level === "error").length };
}

// ─── Daily Activity (last 7 days, from decisions.jsonl) ──────────────────────

export interface DayBar {
  date: string;
  label: string;
  count: number;
}

export async function getDailyActivity(): Promise<DayBar[]> {
  const decisions = await getDecisions(500);
  const countByDate: Record<string, number> = {};
  for (const d of decisions) {
    countByDate[d.date] = (countByDate[d.date] ?? 0) + 1;
  }

  const days: DayBar[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    days.push({ date, label: i === 0 ? "Today" : dayNames[d.getDay()], count: countByDate[date] ?? 0 });
  }
  return days;
}

// ─── Agent Activity (derived from decisions.jsonl) ───────────────────────────

export interface AgentActivity {
  project: string;
  lastDate: string;
  lastSummary: string;
  totalEntries: number;
}

function parseAgentActivity(raw: string): AgentActivity[] {
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

export async function getAgentActivity(): Promise<AgentActivity[]> {
  const raw = readFile(path.join(HOME, "Dev/decisions.jsonl"));
  if (raw) return parseAgentActivity(raw);
  // Fallback: fetch from GitHub
  const ghRaw = await fetchDecisionsFromGitHub();
  if (ghRaw) return parseAgentActivity(ghRaw);
  return [];
}

// ─── Product Registry (parsed from ~/.claude/commands/shared/product-registry.md) ─

export interface RegistryProduct {
  name: string;
  cwdMatch: string;
  repos: { owner: string; name: string }[];
  boardNumber: number;
  platform: string;
  context: string;
}

export function getRegistryProducts(): RegistryProduct[] {
  const registryPath = path.join(HOME, ".claude/commands/shared/product-registry.md");
  const raw = readFile(registryPath);
  if (!raw) return [];

  const products: RegistryProduct[] = [];
  const lines = raw.split("\n");
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) { inTable = false; continue; }

    const cells = trimmed.split("|").map(c => c.trim()).filter(Boolean);
    if (cells.length < 6) { inTable = true; continue; } // header or separator
    if (cells[0].toLowerCase() === "product" || cells[0].startsWith("-")) { inTable = true; continue; }
    if (!inTable) continue;

    const name = cells[0];
    const cwdMatch = cells[1].replace(/`/g, "");
    const repoCell = cells[2];
    const boardNum = parseInt(cells[3]);
    const platform = cells[4];
    const context = cells[5];

    if (!name || isNaN(boardNum)) continue;

    // Parse repo strings like `wkliwk/repo-name`, `wkliwk/other-repo`
    const repos: { owner: string; name: string }[] = [];
    for (const match of repoCell.matchAll(/`([^/`]+)\/([^`]+)`/g)) {
      repos.push({ owner: match[1], name: match[2] });
    }

    products.push({ name, cwdMatch, repos, boardNumber: boardNum, platform, context });
  }

  return products;
}

// ─── Cost Report ─────────────────────────────────────────────────────────────

import type { CostReport } from "@/lib/costs";

async function fetchCostReportFromGitHub(): Promise<CostReport | null> {
  const octokit = await getOctokit();
  if (!octokit) return null;
  const owner = process.env.GITHUB_OWNER?.trim();
  const repo = process.env.GITHUB_REPO?.trim();
  if (!owner || !repo) return null;
  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path: "costs.json" });
    if ("content" in data && typeof data.content === "string") {
      return JSON.parse(Buffer.from(data.content, "base64").toString("utf-8")) as CostReport;
    }
    return null;
  } catch { return null; }
}

export async function getCostReport(): Promise<CostReport | null> {
  const raw = readFile(path.join(process.cwd(), "costs.json"));
  if (raw) {
    try { return JSON.parse(raw) as CostReport; } catch { return null; }
  }
  return fetchCostReportFromGitHub();
}

// ─── Product Repos (auto-discovered from ~/Dev/) ─────────────────────────────

export interface ProductRepo {
  name: string;   // e.g. "money-flow-frontend"
  owner: string;  // e.g. "wkliwk"
  localPath: string;
}

export function getProductRepos(): ProductRepo[] {
  const devDir = path.join(HOME, "Dev");
  const repos: ProductRepo[] = [];
  try {
    const entries = fs.readdirSync(devDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const localPath = path.join(devDir, entry.name);
      try {
        const { execSync } = require("child_process") as typeof import("child_process");
        const remote = execSync(`git -C "${localPath}" remote get-url origin 2>/dev/null`, { timeout: 1000 })
          .toString().trim();
        // Match git@github.com:owner/repo.git or https://github.com/owner/repo.git
        const match = remote.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/);
        if (match) {
          repos.push({ name: match[2], owner: match[1], localPath });
        }
      } catch { /* not a git repo or no remote */ }
    }
  } catch { /* ~/Dev doesn't exist */ }

  // Fallback: if local scan found nothing, parse PRODUCT_REPOS env var
  if (repos.length === 0 && process.env.PRODUCT_REPOS && process.env.GITHUB_OWNER) {
    const owner = process.env.GITHUB_OWNER.trim();
    const repoNames = process.env.PRODUCT_REPOS.split(",").map(r => r.trim()).filter(Boolean);
    for (const name of repoNames) {
      repos.push({ name, owner, localPath: "" });
    }
  }

  return repos;
}
