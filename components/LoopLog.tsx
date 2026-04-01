"use client";

import { useEffect, useState } from "react";
import { getAgentColor } from "@/lib/agents";
import type { LogEntry } from "@/lib/local";

const PAGE_SIZE = 50;

const LEVEL_STYLES: Record<LogEntry["level"], { border: string; label: string; text: string }> = {
  error: { border: "#ef4444", label: "#ef4444", text: "#fca5a5" },
  warn:  { border: "#eab308", label: "#eab308", text: "#fde047" },
  info:  { border: "#3b82f6", label: "#3b82f6", text: "#93c5fd" },
  debug: { border: "#444",    label: "#555",    text: "#888"    },
};

interface Props {
  /** Server-rendered initial entries (dev: from local file; production: first page from Redis) */
  entries: LogEntry[];
  /** Total count across all stored events */
  total?: number;
  /** Total error count across all stored events */
  totalErrors?: number;
}

export function LoopLog({ entries: initialEntries, total: initialTotal, totalErrors: initialTotalErrors }: Props) {
  const [entries, setEntries] = useState<LogEntry[]>(initialEntries);
  const [total, setTotal] = useState(initialTotal ?? initialEntries.length);
  const [totalErrors, setTotalErrors] = useState(
    initialTotalErrors ?? initialEntries.filter(e => e.level === "error").length
  );
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isProduction, setIsProduction] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsProduction(window.location.hostname !== "localhost");
  }, []);

  async function fetchPage(newOffset: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/loop-events?offset=${newOffset}&limit=${PAGE_SIZE}`, { cache: "no-store" });
      const data = await res.json();
      setEntries(data.events ?? []);
      setTotal(data.total ?? 0);
      setTotalErrors(data.totalErrors ?? 0);
      setOffset(newOffset);
    } catch { /* retain current page */ }
    setLoading(false);
  }

  // For local dev, slice the server-provided flat array; for production, use fetched page
  const visibleEntries = (!isClient || !isProduction)
    ? initialEntries.slice(offset, offset + PAGE_SIZE)
    : entries;

  const effectiveTotal = (!isClient || !isProduction) ? initialEntries.length : total;
  const totalPages = Math.ceil(effectiveTotal / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE);
  const start = offset + 1;
  const end = Math.min(offset + PAGE_SIZE, effectiveTotal);
  const hasPrev = offset > 0;
  const hasNext = end < effectiveTotal;

  function handlePrev() {
    const newOffset = offset - PAGE_SIZE;
    if (isProduction) fetchPage(newOffset);
    else setOffset(newOffset);
  }

  function handleNext() {
    const newOffset = offset + PAGE_SIZE;
    if (isProduction) fetchPage(newOffset);
    else setOffset(newOffset);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] uppercase tracking-widest text-[#888] font-medium">Loop Log</div>
        <div className="flex items-center gap-2">
          {totalErrors > 0 && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: "#ef444422", color: "#ef4444" }}>
              {totalErrors} error{totalErrors !== 1 ? "s" : ""}
            </span>
          )}
          {effectiveTotal > PAGE_SIZE && (
            <span className="text-[10px] text-[#555]">
              {start}–{end} of {effectiveTotal}
            </span>
          )}
        </div>
      </div>

      {visibleEntries.length === 0 ? (
        <div className="text-xs text-[#888] py-4 text-center">
          {loading ? "Loading…" : "No loop log entries yet"}
        </div>
      ) : (
        <>
          <div className={`space-y-0 transition-opacity duration-150 ${loading ? "opacity-50" : "opacity-100"}`}>
            {visibleEntries.map((e, i) => {
              const s = LEVEL_STYLES[e.level];
              return (
                <div key={i}
                  className="flex items-start gap-3 py-2 border-b border-[#222] pl-2"
                  style={{ borderLeft: `2px solid ${s.border}` }}>
                  <span className="text-[10px] text-[#888] shrink-0 mt-0.5 w-32">{e.timestamp || "—"}</span>
                  {e.product && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                      style={{ background: `${s.label}22`, color: s.label }}>
                      {e.product}
                    </span>
                  )}
                  {e.agent && e.agent !== "loop" && (() => {
                    const ac = getAgentColor(e.agent);
                    const al = e.agent.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                    return (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                        style={{ background: ac + "22", color: ac }}>
                        {al}
                      </span>
                    );
                  })()}
                  <span className="text-xs leading-relaxed" style={{ color: s.text }}>{e.action}</span>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#222]">
              <button
                onClick={handlePrev}
                disabled={!hasPrev || loading}
                className="text-[11px] px-3 py-1 rounded border border-[#2a2a2a] text-[#888] hover:text-[#ccc] hover:border-[#444] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Newer
              </button>
              <span className="text-[10px] text-[#555]">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={handleNext}
                disabled={!hasNext || loading}
                className="text-[11px] px-3 py-1 rounded border border-[#2a2a2a] text-[#888] hover:text-[#ccc] hover:border-[#444] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Older →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
