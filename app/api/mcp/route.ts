/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs") as typeof import("fs");
const os = require("os") as typeof import("os");
const path = require("path") as typeof import("path");
const { execSync } = require("child_process") as typeof import("child_process");
import { NextResponse } from "next/server";
import type { McpServer, InstalledPlugin } from "@/lib/mcp-types";
import { withCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export type { McpServer, InstalledPlugin };

const HOME = os.homedir();

function readMcpServers(filePath: string, source: "global" | "project"): McpServer[] {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    const servers = data.mcpServers ?? {};
    return Object.entries(servers).map(([name, cfg]: [string, unknown]) => {
      const c = cfg as Record<string, unknown>;
      return {
        name,
        source,
        type: (c.type as "stdio" | "sse") ?? "stdio",
        command: (c.command as string) ?? "",
        args: (c.args as string[]) ?? [],
        env: (c.env as Record<string, string>) ?? {},
        running: false,
      };
    });
  } catch {
    return [];
  }
}

function getRunningProcesses(): string {
  try {
    return execSync("ps aux", { timeout: 3000 }).toString();
  } catch {
    return "";
  }
}

function isRunning(server: McpServer, psOutput: string): boolean {
  // Match on the command name or first arg (e.g. "serena", "playwright", "telegram")
  const needle = server.name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cmdStr = [server.command, ...server.args].join(" ").toLowerCase();
  // Check if any distinctive part of the command appears in ps output
  const keywords = [server.name, server.command, server.args[0] ?? ""]
    .filter(Boolean)
    .map(k => k.toLowerCase());
  return keywords.some(kw => kw.length > 3 && psOutput.toLowerCase().includes(kw)) &&
    // Avoid false positives on very common commands like "npx" or "bun"
    (needle.length > 3 ? psOutput.toLowerCase().includes(needle) : false);
}

function readPlugins(): InstalledPlugin[] {
  try {
    const filePath = path.join(HOME, ".claude/plugins/installed_plugins.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    const plugins: InstalledPlugin[] = [];
    for (const [key, installs] of Object.entries(data.plugins ?? {})) {
      const arr = installs as Array<Record<string, unknown>>;
      const latest = arr[arr.length - 1];
      const [name, marketplace] = key.split("@");
      plugins.push({
        id: key,
        name,
        marketplace: marketplace ?? "unknown",
        version: (latest.version as string) ?? "?",
        scope: (latest.scope as string) ?? "user",
        installedAt: (latest.installedAt as string) ?? "",
        lastUpdated: (latest.lastUpdated as string) ?? "",
      });
    }
    return plugins;
  } catch {
    return [];
  }
}

export async function GET() {
  const data = await withCache<{ servers: McpServer[]; plugins: InstalledPlugin[]; updatedAt: string }>(
    "mcp",
    30000,
    async () => {
      const globalServers = readMcpServers(path.join(HOME, ".claude.json"), "global");
      const projectServers = readMcpServers(path.join(HOME, ".claude/mcp.json"), "project");

      const all = [...globalServers, ...projectServers];
      const ps = getRunningProcesses();

      const servers = all.map(s => ({ ...s, running: isRunning(s, ps) }));
      const plugins = readPlugins();

      return { servers, plugins, updatedAt: new Date().toISOString() };
    }
  );

  return NextResponse.json(data);
}
