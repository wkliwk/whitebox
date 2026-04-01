import type { LogEntry } from "./local";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _redis: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getRedis(): any | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Redis } = require("@upstash/redis");
  _redis = new Redis({ url, token });
  return _redis;
}

// ─── Last Task ───────────────────────────────────────────────────────────────

export interface LastTask {
  task: string;
  project: string;
  issueNumber?: number;
  issueRepo?: string;
  completedAt: string;
}

const LAST_TASK_PREFIX = "agent:last-task:";
const LAST_TASK_TTL = 86400; // 24h

export async function setAgentLastTask(agentType: string, record: LastTask): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(`${LAST_TASK_PREFIX}${agentType}`, JSON.stringify(record), { ex: LAST_TASK_TTL });
  } catch { /* silent */ }
}

export async function getAgentLastTasks(): Promise<Record<string, LastTask>> {
  const redis = getRedis();
  if (!redis) return {};
  try {
    const keys: string[] = await redis.keys(`${LAST_TASK_PREFIX}*`);
    if (!keys.length) return {};
    const values: (string | null)[] = await redis.mget(...keys);
    const result: Record<string, LastTask> = {};
    keys.forEach((key, i) => {
      const val = values[i];
      if (!val) return;
      const agentType = key.replace(LAST_TASK_PREFIX, "");
      try { result[agentType] = JSON.parse(val) as LastTask; } catch { /* skip malformed */ }
    });
    return result;
  } catch { return {}; }
}

// ─── Heartbeat Types ────────────────────────────────────────────────────────

export interface Heartbeat {
  agentType: string;
  status: "started" | "alive" | "completed";
  task: string;
  project: string;
  startedAt: string;
  lastPing: string;
}

const KEY_PREFIX = "agent:heartbeat:";
const TTL_SECONDS = 180; // 3 minutes — auto-expires if agent crashes

export async function writeHeartbeat(agentType: string, heartbeat: Heartbeat): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  await redis.set(`${KEY_PREFIX}${agentType}`, JSON.stringify(heartbeat), { ex: TTL_SECONDS });
  return true;
}

export async function removeHeartbeat(agentType: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  await redis.del(`${KEY_PREFIX}${agentType}`);
  return true;
}

export async function getAllHeartbeats(): Promise<Heartbeat[]> {
  const redis = getRedis();
  if (!redis) return [];
  const keys = await redis.keys(`${KEY_PREFIX}*`);
  if (keys.length === 0) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const values = await (redis.mget(...keys) as Promise<any[]>);
  const heartbeats: Heartbeat[] = [];
  for (const val of values) {
    if (!val) continue;
    try {
      const parsed = typeof val === "string" ? JSON.parse(val) : val;
      heartbeats.push(parsed as Heartbeat);
    } catch { /* skip malformed */ }
  }
  return heartbeats;
}

// ─── Loop Events ─────────────────────────────────────────────────────────────

const LOOP_EVENTS_KEY = "whitebox:loop-events";

function parseLoopEvent(item: unknown): LogEntry {
  try {
    const parsed = typeof item === "string" ? JSON.parse(item) : item;
    return parsed as LogEntry;
  } catch {
    return { timestamp: "", product: "", action: String(item), level: "debug" as const };
  }
}

export interface LoopEventsResult {
  events: LogEntry[];
  total: number;
  totalErrors: number;
  offset: number;
  limit: number;
}

export async function getLoopEvents(limit = 50, offset = 0): Promise<LoopEventsResult> {
  const redis = getRedis();
  if (!redis) return { events: [], total: 0, totalErrors: 0, offset, limit };
  try {
    const [page, allRaw, totalRaw] = await Promise.all([
      redis.lrange(LOOP_EVENTS_KEY, offset, offset + limit - 1) as Promise<string[]>,
      redis.lrange(LOOP_EVENTS_KEY, 0, 199) as Promise<string[]>,
      redis.llen(LOOP_EVENTS_KEY) as Promise<number>,
    ]);
    const all = allRaw.map(parseLoopEvent);
    const totalErrors = all.filter(e => e.level === "error").length;
    return {
      events: page.map(parseLoopEvent),
      total: totalRaw,
      totalErrors,
      offset,
      limit,
    };
  } catch {
    return { events: [], total: 0, totalErrors: 0, offset, limit };
  }
}

// ─── Session History ─────────────────────────────────────────────────────────

const SESSION_HISTORY_KEY = "whitebox:session-history";
const SESSION_HISTORY_CAP = 50;

export interface SessionHistoryRecord {
  agentType: string;
  task: string;
  project: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  issueNumber?: number;
  issueRepo?: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
}

export async function pushSessionHistory(record: SessionHistoryRecord): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.lpush(SESSION_HISTORY_KEY, JSON.stringify(record));
    await redis.ltrim(SESSION_HISTORY_KEY, 0, SESSION_HISTORY_CAP - 1);
  } catch { /* silent */ }
}

export async function getSessionHistory(): Promise<SessionHistoryRecord[]> {
  const redis = getRedis();
  if (!redis) return [];
  try {
    const raw: string[] = await redis.lrange(SESSION_HISTORY_KEY, 0, SESSION_HISTORY_CAP - 1);
    return raw.map(item => {
      try { return JSON.parse(item) as SessionHistoryRecord; }
      catch { return null; }
    }).filter((r): r is SessionHistoryRecord => r !== null);
  } catch { return []; }
}

// ─── Cost History ─────────────────────────────────────────────────────────────

const COST_HISTORY_KEY = "whitebox:cost-history";
const COST_HISTORY_CAP = 14; // 2 weeks of daily snapshots

export interface DailyCostSnapshot {
  date: string; // "YYYY-MM-DD"
  totalSpend: number;
  byAgent: Record<string, number>;
}

export async function pushCostSnapshot(snapshot: DailyCostSnapshot): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.lpush(COST_HISTORY_KEY, JSON.stringify(snapshot));
    await redis.ltrim(COST_HISTORY_KEY, 0, COST_HISTORY_CAP - 1);
  } catch { /* silent */ }
}

export async function getCostHistory(): Promise<DailyCostSnapshot[]> {
  const redis = getRedis();
  if (!redis) return [];
  try {
    const raw: string[] = await redis.lrange(COST_HISTORY_KEY, 0, COST_HISTORY_CAP - 1);
    return raw.map(item => {
      try { return JSON.parse(item) as DailyCostSnapshot; }
      catch { return null; }
    }).filter((r): r is DailyCostSnapshot => r !== null);
  } catch { return []; }
}
