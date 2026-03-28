"use client";

import { useEffect, useState } from "react";
import type { McpServer, InstalledPlugin } from "@/app/api/mcp/route";

// ── descriptions ──────────────────────────────────────────────────────────────

const serverDescriptions: Record<string, string> = {
  playwright:        "Browser automation — screenshots, navigation, interactions",
  expo:              "Expo / React Native project tooling",
  serena:            "Codebase semantic search and symbol navigation",
  "chrome-devtools": "Chrome DevTools protocol — inspect, profile, debug",
  telegram2:         "Telegram bot integration — send/receive messages",
  github:            "GitHub API — issues, PRs, repos",
  figma:             "Figma design file access and inspection",
  notion:            "Notion workspace — pages, databases, comments",
  vercel:            "Vercel deployments, projects, logs",
  "google-calendar": "Google Calendar — events, scheduling",
  gmail:             "Gmail — read and draft emails",
  penpot:            "Penpot design tool",
  tldraw:            "tldraw diagram and drawing canvas",
  "hugging-face":    "Hugging Face Hub — models, datasets, spaces",
};

const pluginDescriptions: Record<string, string> = {
  telegram: "Telegram bot — bidirectional messaging and file delivery",
  figma:    "Figma design context, screenshots, and code generation",
  github:   "GitHub integration — issues, PRs, code search",
};

function getDesc(name: string, map: Record<string, string>): string {
  const key = Object.keys(map).find(k => name.toLowerCase().includes(k.toLowerCase()));
  return key ? map[key] : "";
}

// ── sub-components ─────────────────────────────────────────────────────────────

function StatusDot({ running }: { running?: boolean }) {
  return (
    <span className="relative flex w-2 h-2 shrink-0">
      {running && (
        <span className="absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping bg-[#22c55e]" />
      )}
      <span
        className="relative inline-flex w-2 h-2 rounded-full"
        style={{ background: running ? "#22c55e" : "#2a2a2a" }}
      />
    </span>
  );
}

function CmdChip({ cmd, args }: { cmd: string; args: string[] }) {
  const full = [cmd, ...args].join(" ");
  const display = full.length > 64 ? full.slice(0, 61) + "…" : full;
  return (
    <code className="text-[10px] text-[#777] bg-[#1a1a1a] px-2 py-0.5 rounded font-mono break-all">
      {display}
    </code>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-widest text-[#888] font-medium mb-3">
      {children}
    </div>
  );
}

function Card({ children, live }: { children: React.ReactNode; live?: boolean }) {
  return (
    <div
      className="rounded-lg border p-4 space-y-2.5 transition-colors"
      style={{ background: "#161616", borderColor: live ? "#2a2a2a" : "#1e1e1e" }}
    >
      {children}
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0"
      style={{ background: color ? color + "18" : "#222", color: color ?? "#777" }}
    >
      {children}
    </span>
  );
}

// ── server card ────────────────────────────────────────────────────────────────

function McpServerCard({ server }: { server: McpServer }) {
  const desc = getDesc(server.name, serverDescriptions);
  const envCount = Object.keys(server.env).length;
  return (
    <Card live={server.running}>
      <div className="flex items-center gap-2">
        <StatusDot running={server.running} />
        <span className="text-xs font-medium text-[#ccc] flex-1 truncate">{server.name}</span>
        <Badge>{server.type}</Badge>
        {server.running && <Badge color="#22c55e">running</Badge>}
      </div>
      {desc && <div className="text-[11px] text-[#777]">{desc}</div>}
      <CmdChip cmd={server.command} args={server.args} />
      {envCount > 0 && (
        <div className="text-[10px] text-[#777]">
          {envCount} env var{envCount !== 1 ? "s" : ""} configured
        </div>
      )}
    </Card>
  );
}

// ── plugin card ────────────────────────────────────────────────────────────────

function PluginCard({ plugin }: { plugin: InstalledPlugin }) {
  const desc = getDesc(plugin.name, pluginDescriptions);
  const updated = plugin.lastUpdated
    ? new Date(plugin.lastUpdated).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;
  return (
    <Card>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#3b82f6" }} />
        <span className="text-xs font-medium text-[#ccc] flex-1 truncate">{plugin.name}</span>
        <Badge color="#3b82f6">v{plugin.version}</Badge>
        <Badge>{plugin.scope}</Badge>
      </div>
      {desc && <div className="text-[11px] text-[#777]">{desc}</div>}
      <div className="text-[10px] text-[#777] font-mono">{plugin.marketplace}</div>
      {updated && <div className="text-[10px] text-[#777]">Updated {updated}</div>}
    </Card>
  );
}

// ── main panel ─────────────────────────────────────────────────────────────────

export function ToolsPanel() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [plugins, setPlugins] = useState<InstalledPlugin[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mcp", { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        setServers(d.servers ?? []);
        setPlugins(d.plugins ?? []);
        setUpdatedAt(d.updatedAt ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-xs text-[#888]">Loading…</div>;

  const globalServers = servers.filter(s => s.source === "global");
  const projectServers = servers.filter(s => s.source === "project");
  const runningCount = servers.filter(s => s.running).length;

  return (
    <div className="space-y-8">
      {/* Summary bar */}
      <div className="flex items-center gap-5 text-[11px]">
        <span className="text-[#777]">
          {servers.length} MCP server{servers.length !== 1 ? "s" : ""}
          {plugins.length > 0 && ` · ${plugins.length} plugin${plugins.length !== 1 ? "s" : ""}`}
        </span>
        {runningCount > 0 && (
          <span className="flex items-center gap-1.5 text-[#22c55e]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse inline-block" />
            {runningCount} running
          </span>
        )}
        {updatedAt && (
          <span className="ml-auto text-[#2a2a2a] text-[10px]">
            {new Date(updatedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Plugins */}
      {plugins.length > 0 && (
        <div>
          <SectionLabel>Plugins</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {plugins.map(p => <PluginCard key={p.id} plugin={p} />)}
          </div>
        </div>
      )}

      {/* MCP — Global */}
      {globalServers.length > 0 && (
        <div>
          <SectionLabel>MCP — Global</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {globalServers.map(s => <McpServerCard key={`g-${s.name}`} server={s} />)}
          </div>
        </div>
      )}

      {/* MCP — Project */}
      {projectServers.length > 0 && (
        <div>
          <SectionLabel>MCP — Project</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {projectServers.map(s => <McpServerCard key={`p-${s.name}`} server={s} />)}
          </div>
        </div>
      )}

      {servers.length === 0 && plugins.length === 0 && (
        <div className="text-xs text-[#777] py-8 text-center">
          No MCP servers or plugins found. Check ~/.claude.json and ~/.claude/mcp.json
        </div>
      )}
    </div>
  );
}
