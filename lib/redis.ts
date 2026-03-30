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

export async function getLoopEvents(limit = 30): Promise<LogEntry[]> {
  const redis = getRedis();
  if (!redis) return [];
  try {
    const raw: string[] = await redis.lrange(LOOP_EVENTS_KEY, 0, limit - 1);
    return raw.map(item => {
      try {
        const parsed = typeof item === "string" ? JSON.parse(item) : item;
        return parsed as LogEntry;
      } catch {
        return { timestamp: "", product: "", action: String(item), level: "debug" as const };
      }
    });
  } catch {
    return [];
  }
}
