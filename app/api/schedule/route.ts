import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface CronJob {
  schedule: string;
  scheduleHuman: string;
  command: string;
  source: "crontab" | "launchd";
}

export interface LoopRun {
  timestamp: string;
  product: string;
  action: string;
}

function parseCronSchedule(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5) return expr;
  const [min, hour, dom, , dow] = parts;
  if (min === "0" && hour === "*") return "Every hour";
  if (min.startsWith("*/")) return `Every ${min.slice(2)} min`;
  if (hour === "*" && dom === "*" && dow === "*") return `Every hour at :${min.padStart(2, "0")}`;
  if (dom === "*" && dow === "*") return `Daily at ${hour}:${min.padStart(2, "0")}`;
  return expr;
}

function getCronJobs(): CronJob[] {
  const jobs: CronJob[] = [];
  try {
    const raw = execSync("crontab -l 2>/dev/null", { timeout: 3000 }).toString();
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const parts = trimmed.split(/\s+/);
      if (parts.length < 6) continue;
      const schedule = parts.slice(0, 5).join(" ");
      const command = parts.slice(5).join(" ");
      jobs.push({ schedule, scheduleHuman: parseCronSchedule(schedule), command, source: "crontab" });
    }
  } catch { /* no crontab */ }
  return jobs;
}

function getLoopRuns(limit = 50): LoopRun[] {
  const logPath = path.join(os.homedir(), "Dev/whitebox/history/loop-log.txt");
  try {
    const raw = fs.readFileSync(logPath, "utf-8");
    return raw.trim().split("\n").filter(Boolean)
      .map(line => {
        const [timestamp, product, ...rest] = line.split(" | ");
        return {
          timestamp: timestamp?.trim() ?? "",
          product: product?.trim() ?? "",
          action: rest.join(" | ").trim(),
        };
      })
      .slice(-limit)
      .reverse();
  } catch { return []; }
}

export async function GET() {
  const cronJobs = getCronJobs();
  const loopRuns = getLoopRuns();
  return NextResponse.json({ cronJobs, loopRuns, updatedAt: new Date().toISOString() });
}
