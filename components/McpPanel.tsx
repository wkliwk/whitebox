"use client";

import { useEffect, useState } from "react";
import type { McpServer } from "@/app/api/mcp/route";

const sourceColors = {
  global:  { text: "#8b5cf6", bg: "#8b5cf618" },
  project: { text: "#3b82f6", bg: "#3b82f618" },
};

// Well-known MCP server descriptions
const serverDescriptions: Record<string, string> = {
  playwright:       "Browser automation — screenshots, navigation, interactions",
  expo:             "Expo / React Native project tooling",
  serena:           "Codebase semantic search and symbol navigation",
  "chrome-devtools":"Chrome DevTools protocol — inspect, profile, debug",
  telegram2:        "Telegram bot integration — send/receive messages",
  github:           "GitHub API — issues, PRs, repos",
  figma:            "Figma design file access and inspection",
  notion:           "Notion workspace — pages, databases, comments",
  vercel:           "Vercel deployments, projects, logs",
  "google-calendar":"Google Calendar — events, scheduling",
  gmail:            "Gmail — read and draft emails",
};

function getDescription(name: string): string {
  const key = Object.keys(serverDescriptions).find(k =>
    name.toLowerCase().includes(k.toLowerCase())
  );
  return key ? serverDescriptions[key] : "MCP server";
}

function CommandChip({ cmd, args }: { cmd: string; args: string[] }) {
  const short = [cmd, ...args].join(" ");
  const display = short.length > 60 ? short.slice(0, 57) + "…" : short;
  return (
    <code className="text-[10px] text-[#555] bg-[#1a1a1a] px-2 py-0.5 rounded font-mono break-all">
      {display}
    </code>
  );
}

export function McpPanel() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mcp", { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        setServers(d.servers ?? []);
        setUpdatedAt(d.updatedAt ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-xs text-[#444]">Loading…</div>;
  }

  if (servers.length === 0) {
    return (
      <div className="text-xs text-[#555] py-8 text-center">
        No MCP servers configured in ~/.claude.json or ~/.claude/mcp.json
      </div>
    );
  }

  const global = servers.filter(s => s.source === "global");
  const project = servers.filter(s => s.source === "project");
  const runningCount = servers.filter(s => s.running).length;

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex items-center gap-4 text-[11px]">
        <span className="text-[#555]">{servers.length} servers configured</span>
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

      {/* Global servers */}
      {global.length > 0 && (
        <Section title="Global" color={sourceColors.global} servers={global} />
      )}

      {/* Project servers */}
      {project.length > 0 && (
        <Section title="Project" color={sourceColors.project} servers={project} />
      )}
    </div>
  );
}

function Section({
  title,
  color,
  servers,
}: {
  title: string;
  color: { text: string; bg: string };
  servers: McpServer[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 rounded"
          style={{ background: color.bg, color: color.text }}>
          {title}
        </span>
        <span className="text-[10px] text-[#333]">{servers.length}</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {servers.map(s => <ServerCard key={`${s.source}-${s.name}`} server={s} />)}
      </div>
    </div>
  );
}

function ServerCard({ server }: { server: McpServer }) {
  const hasEnvSecrets = Object.keys(server.env).length > 0;

  return (
    <div className="rounded-lg border p-4 space-y-3 transition-colors"
      style={{
        background: "#161616",
        borderColor: server.running ? "#2a2a2a" : "#1e1e1e",
      }}>

      {/* Header */}
      <div className="flex items-center gap-2">
        {/* Status dot */}
        <span className="relative flex w-2 h-2 shrink-0">
          {server.running && (
            <span className="absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping bg-[#22c55e]" />
          )}
          <span className="relative inline-flex w-2 h-2 rounded-full"
            style={{ background: server.running ? "#22c55e" : "#2a2a2a" }} />
        </span>

        <span className="text-xs font-medium text-[#ccc] flex-1">{server.name}</span>

        {/* Type badge */}
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#222] text-[#444] font-mono">
          {server.type}
        </span>

        {/* Running badge */}
        {server.running && (
          <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-[#22c55e18] text-[#22c55e]">
            running
          </span>
        )}
      </div>

      {/* Description */}
      <div className="text-[11px] text-[#555]">{getDescription(server.name)}</div>

      {/* Command */}
      <CommandChip cmd={server.command} args={server.args} />

      {/* Env secrets indicator */}
      {hasEnvSecrets && (
        <div className="text-[10px] text-[#333]">
          {Object.keys(server.env).length} env var{Object.keys(server.env).length !== 1 ? "s" : ""} configured
        </div>
      )}
    </div>
  );
}
