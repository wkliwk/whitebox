"use client";

import { useState } from "react";
import { getAgentColor } from "@/lib/agents";
import type { SessionHistoryRecord } from "@/lib/redis";

type SortKey = "cost" | "tokens" | "duration" | "date";

function formatDuration(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function agentLabel(agentType: string): string {
  return agentType.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

interface Props {
  sessions: SessionHistoryRecord[];
}

export function SessionCostTable({ sessions }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("cost");
  const [sortDesc, setSortDesc] = useState(true);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDesc(d => !d);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  }

  const sorted = [...sessions].sort((a, b) => {
    let va = 0;
    let vb = 0;
    if (sortKey === "cost") {
      va = a.costUsd ?? 0;
      vb = b.costUsd ?? 0;
    } else if (sortKey === "tokens") {
      va = (a.inputTokens ?? 0) + (a.outputTokens ?? 0);
      vb = (b.inputTokens ?? 0) + (b.outputTokens ?? 0);
    } else if (sortKey === "duration") {
      va = a.durationMs;
      vb = b.durationMs;
    } else if (sortKey === "date") {
      va = new Date(a.completedAt).getTime();
      vb = new Date(b.completedAt).getTime();
    }
    return sortDesc ? vb - va : va - vb;
  });

  const top20 = sorted.slice(0, 20);

  function SortBtn({ k, label }: { k: SortKey; label: string }) {
    const active = sortKey === k;
    return (
      <button
        onClick={() => handleSort(k)}
        className={`text-[10px] uppercase tracking-wide transition-colors ${
          active ? "text-[#aaa]" : "text-[#555] hover:text-[#777]"
        }`}
      >
        {label}
        {active && (
          <span className="ml-0.5">{sortDesc ? "↓" : "↑"}</span>
        )}
      </button>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-[#222] bg-[#161616] p-5">
        <div className="text-[10px] uppercase tracking-widest text-[#888] font-medium mb-4">
          Top Sessions
        </div>
        <div className="text-xs text-[#555] text-center py-8">No session history yet</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#222] bg-[#161616] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] uppercase tracking-widest text-[#888] font-medium">
          Top Sessions
        </div>
        <div className="text-[10px] text-[#444]">{sessions.length} total</div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 items-center pb-2 border-b border-[#1e1e1e] mb-1">
        <div className="text-[10px] text-[#555] uppercase tracking-wide">Agent / Task</div>
        <SortBtn k="date" label="Date" />
        <SortBtn k="tokens" label="Tokens" />
        <SortBtn k="duration" label="Duration" />
        <SortBtn k="cost" label="Cost" />
      </div>

      <div className="space-y-0">
        {top20.map((r, i) => {
          const color = getAgentColor(r.agentType);
          const totalTokens = (r.inputTokens ?? 0) + (r.outputTokens ?? 0);
          const issueUrl = r.issueNumber && r.issueRepo
            ? `https://github.com/${r.issueRepo}/issues/${r.issueNumber}`
            : null;

          return (
            <div
              key={i}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 items-center py-2.5 border-b border-[#1a1a1a] last:border-0"
            >
              {/* Agent / task */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-[10px] font-medium shrink-0" style={{ color }}>
                    {agentLabel(r.agentType)}
                  </span>
                  {r.project && (
                    <span className="text-[10px] text-[#555] font-mono shrink-0">{r.project}</span>
                  )}
                  {issueUrl && r.issueNumber && (
                    <a
                      href={issueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#777] bg-[#1a1a1a] px-1 py-0.5 rounded hover:text-[#aaa] transition-colors shrink-0"
                    >
                      #{r.issueNumber}
                    </a>
                  )}
                </div>
                {r.task && (
                  <p className="text-[10px] text-[#555] truncate">
                    {r.task.length > 80 ? r.task.slice(0, 80) + "…" : r.task}
                  </p>
                )}
              </div>

              {/* Date */}
              <div className="text-[10px] text-[#555] font-mono whitespace-nowrap shrink-0">
                {formatDate(r.completedAt)}
              </div>

              {/* Tokens */}
              <div className="text-[10px] text-[#555] font-mono whitespace-nowrap shrink-0 text-right">
                {totalTokens > 0 ? formatTokens(totalTokens) : "—"}
              </div>

              {/* Duration */}
              <div className="text-[10px] text-[#555] font-mono whitespace-nowrap shrink-0 text-right">
                {r.durationMs > 0 ? formatDuration(r.durationMs) : "—"}
              </div>

              {/* Cost */}
              <div className="text-[10px] font-mono whitespace-nowrap shrink-0 text-right"
                style={{ color: (r.costUsd ?? 0) > 0 ? "#e8e8e8" : "#555" }}>
                {(r.costUsd ?? 0) > 0 ? `$${r.costUsd!.toFixed(3)}` : "—"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
