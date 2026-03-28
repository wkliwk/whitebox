import fs from "fs";
import os from "os";
import { execSync } from "child_process";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const HOME = os.homedir();

interface QuotaResponse {
  fiveHourPct: number | null;
  sevenDayPct: number | null;
  sevenDaySonnetPct: number | null;
  fiveHourResetsAt: string | null;   // ISO string
  sevenDayResetsAt: string | null;   // ISO string
  updatedAt: string | null;
  source: "live" | "statusline-cache" | "legacy-cache" | "none";
}

/** Read /tmp/claude/statusline-usage-cache.json — updated by statusline every ~60s when Claude is running */
function readStatuslineCache(): QuotaResponse | null {
  try {
    const raw = fs.readFileSync("/tmp/claude/statusline-usage-cache.json", "utf-8");
    const d = JSON.parse(raw);
    const stat = fs.statSync("/tmp/claude/statusline-usage-cache.json");
    return {
      fiveHourPct:       Math.round(d.five_hour?.utilization ?? 0),
      sevenDayPct:       Math.round(d.seven_day?.utilization ?? 0),
      sevenDaySonnetPct: d.seven_day_sonnet ? Math.round(d.seven_day_sonnet.utilization) : null,
      fiveHourResetsAt:  d.five_hour?.resets_at ?? null,
      sevenDayResetsAt:  d.seven_day?.resets_at ?? null,
      updatedAt:         stat.mtime.toISOString(),
      source:            "statusline-cache",
    };
  } catch {
    return null;
  }
}

/** Fetch live from https://api.anthropic.com/api/oauth/usage using keychain OAuth token */
async function fetchLive(): Promise<QuotaResponse | null> {
  try {
    const blob = execSync(
      'security find-generic-password -s "Claude Code-credentials" -w 2>/dev/null',
      { timeout: 3000 }
    ).toString().trim();
    if (!blob) return null;
    const creds = JSON.parse(blob);
    const token: string = creds?.claudeAiOauth?.accessToken;
    if (!token) return null;

    const res = await fetch("https://api.anthropic.com/api/oauth/usage", {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const d = await res.json();

    return {
      fiveHourPct:       Math.round(d.five_hour?.utilization ?? 0),
      sevenDayPct:       Math.round(d.seven_day?.utilization ?? 0),
      sevenDaySonnetPct: d.seven_day_sonnet ? Math.round(d.seven_day_sonnet.utilization) : null,
      fiveHourResetsAt:  d.five_hour?.resets_at ?? null,
      sevenDayResetsAt:  d.seven_day?.resets_at ?? null,
      updatedAt:         new Date().toISOString(),
      source:            "live",
    };
  } catch {
    return null;
  }
}

/** Legacy fallback: ~/.claude/usage-monitor/usage-cache.json (stale if Claude hasn't run recently) */
function readLegacyCache(): QuotaResponse | null {
  try {
    const raw = fs.readFileSync(`${HOME}/.claude/usage-monitor/usage-cache.json`, "utf-8");
    const d = JSON.parse(raw);
    return {
      fiveHourPct:       d.rate_limits?.five_hour?.used_percentage ?? null,
      sevenDayPct:       d.rate_limits?.seven_day?.used_percentage ?? null,
      sevenDaySonnetPct: null,
      fiveHourResetsAt:  d.rate_limits?.five_hour?.resets_at
        ? new Date((d.rate_limits.five_hour.resets_at as number) * 1000).toISOString()
        : null,
      sevenDayResetsAt:  d.rate_limits?.seven_day?.resets_at
        ? new Date((d.rate_limits.seven_day.resets_at as number) * 1000).toISOString()
        : null,
      updatedAt:         d.updated_at ?? null,
      source:            "legacy-cache",
    };
  } catch {
    return null;
  }
}

export async function GET() {
  // 1. Try statusline cache (good if Claude Code has run in last ~60s)
  const statusline = readStatuslineCache();
  if (statusline) {
    const ageMs = statusline.updatedAt
      ? Date.now() - new Date(statusline.updatedAt).getTime()
      : Infinity;
    // If cache is < 10 minutes old, use it directly
    if (ageMs < 10 * 60 * 1000) {
      return NextResponse.json(statusline);
    }
  }

  // 2. Fetch live from Anthropic API
  const live = await fetchLive();
  if (live) return NextResponse.json(live);

  // 3. Fall back to stale statusline cache (better than nothing)
  if (statusline) return NextResponse.json(statusline);

  // 4. Final fallback: legacy usage-cache.json
  const legacy = readLegacyCache();
  if (legacy) return NextResponse.json(legacy);

  return NextResponse.json({
    fiveHourPct: null, sevenDayPct: null, sevenDaySonnetPct: null,
    fiveHourResetsAt: null, sevenDayResetsAt: null, updatedAt: null, source: "none",
  } satisfies QuotaResponse);
}
