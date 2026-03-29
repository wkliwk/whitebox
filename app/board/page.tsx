import { ExternalLink } from "lucide-react";
import { GitHubIcon } from "@/components/GitHubIcon";
import { Sidebar } from "@/components/Sidebar";
import { getProductRepos } from "@/lib/local";
import { getProjectBoard, BOARD_DEFS } from "@/lib/projects";
import type { BoardItem } from "@/lib/projects";
import { AGENT_COLORS } from "@/lib/agents";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Board — Whitebox",
};

export const revalidate = 30;

const STATUS_ORDER = ["Todo", "In Progress", "Done"];

const statusColors: Record<string, { dot: string; text: string; bg: string }> = {
  "Todo":        { dot: "#3b82f6", text: "#3b82f6", bg: "#3b82f611" },
  "In Progress": { dot: "#eab308", text: "#eab308", bg: "#eab30811" },
  "Done":        { dot: "#22c55e", text: "#22c55e", bg: "#22c55e11" },
  // Ideas board stages
  "Draft":       { dot: "#6b7280", text: "#6b7280", bg: "#6b728011" },
  "Approved":    { dot: "#f97316", text: "#f97316", bg: "#f9731611" },
  "Launched":    { dot: "#22c55e", text: "#22c55e", bg: "#22c55e11" },
};

const FALLBACK_COLORS = ["#8b5cf6", "#06b6d4", "#ec4899", "#eab308", "#3b82f6"];
function getStatusColor(status: string) {
  return statusColors[status] ?? (() => {
    const c = FALLBACK_COLORS[Math.abs(status.charCodeAt(0)) % FALLBACK_COLORS.length];
    return { dot: c, text: c, bg: c + "11" };
  })();
}

const priorityColors: Record<string, string> = {
  p0: "#ef4444", p1: "#f97316", p2: "#777",
};

const agentColors = AGENT_COLORS;

function ItemCard({ item }: { item: BoardItem }) {
  const agentColor = agentColors[item.agent] ?? "#444";
  const prioColor = priorityColors[item.priority] ?? "#555";

  return (
    <a href={item.url} target="_blank" rel="noreferrer"
      className="block p-3 rounded-lg border border-[#222] hover:border-[#333] transition-colors group"
      style={{ background: "#1a1a1a" }}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-[10px] text-[#888] shrink-0">#{item.number}</span>
        <ExternalLink size={10} className="text-[#2a2a2a] group-hover:text-[#777] shrink-0 mt-0.5 transition-colors" />
      </div>
      <p className="text-xs text-[#ccc] leading-relaxed mb-2 group-hover:text-[#e8e8e8] transition-colors">
        {item.title}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        {item.repo && (
          <span className="text-[9px] text-[#888] bg-[#222] px-1.5 py-0.5 rounded truncate max-w-[90px]">
            {item.repo}
          </span>
        )}
        {item.priority && (
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: prioColor + "22", color: prioColor }}>
            {item.priority.toUpperCase()}
          </span>
        )}
        {item.agent && (
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: agentColor + "22", color: agentColor }}>
            {item.agent}
          </span>
        )}
        {item.size && (
          <span className="text-[9px] text-[#777] bg-[#1e1e1e] px-1.5 py-0.5 rounded ml-auto">
            {item.size.toUpperCase()}
          </span>
        )}
      </div>
    </a>
  );
}

interface PageProps {
  searchParams: Promise<{ board?: string }>;
}

export default async function BoardPage({ searchParams }: PageProps) {
  const { board: boardParam } = await searchParams;
  const activeBoardNumber = parseInt(boardParam ?? "8");

  const [boardData, sidebarProjects] = await Promise.all([
    getProjectBoard(activeBoardNumber),
    Promise.resolve(getProductRepos().map(r => ({
      name: r.name,
      url: `https://github.com/${r.owner}/${r.name}`,
    }))),
  ]);

  // Build column order: prefer STATUS_ORDER for known values, append any unknown ones
  const columnOrder = [...STATUS_ORDER];
  if (boardData) {
    for (const item of boardData.items) {
      if (item.status && !columnOrder.some(s => item.status.toLowerCase() === s.toLowerCase())) {
        columnOrder.push(item.status);
      }
    }
  }

  // Group items by status — case-insensitive match
  const grouped = new Map<string, BoardItem[]>();
  for (const col of columnOrder) grouped.set(col, []);

  if (boardData) {
    for (const item of boardData.items) {
      const key = columnOrder.find(s => s.toLowerCase() === item.status.toLowerCase())
        ?? columnOrder.find(s => item.status.toLowerCase().includes(s.toLowerCase()))
        ?? columnOrder[0];
      grouped.get(key)?.push(item);
    }
  }

  const activeDef = BOARD_DEFS.find(b => b.number === activeBoardNumber);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#111111" }}>
      <Sidebar projects={sidebarProjects} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#888] mb-0.5">Board</div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-[#e8e8e8]">
                  {boardData?.title ?? activeDef?.label ?? `Project ${activeBoardNumber}`}
                </h1>
                {boardData && (
                  <a href={boardData.url} target="_blank" rel="noreferrer"
                    className="text-[10px] text-[#888] hover:text-[#888] flex items-center gap-1">
                    <GitHubIcon className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Item count badge */}
            {boardData && (
              <div className="text-[10px] text-[#777]">
                {boardData.items.length} items
              </div>
            )}
          </div>

          {/* Board tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            {BOARD_DEFS.map(def => (
              <a key={def.number}
                href={`/board?board=${def.number}`}
                className="text-[11px] px-2.5 py-1 rounded font-medium transition-colors"
                style={activeBoardNumber === def.number
                  ? { background: def.color + "22", color: def.color }
                  : { background: "#1a1a1a", color: "#555" }}>
                {def.label}
              </a>
            ))}
          </div>

          {!process.env.GITHUB_TOKEN ? (
            <div className="py-12 text-center">
              <div className="text-xs text-[#777] mb-1">Board data unavailable</div>
              <div className="text-[10px] text-[#777]">Configure GITHUB_TOKEN in .env.local to enable this page</div>
            </div>
          ) : !boardData ? (
            <div className="py-12 text-center">
              <div className="text-xs text-[#777] mb-1">Could not load board</div>
              <div className="text-[10px] text-[#777]">Board {activeBoardNumber} may not exist or is inaccessible</div>
            </div>
          ) : (
            /* Kanban columns — dynamic based on actual status values */
            <div className="grid grid-cols-1 gap-4"
              style={{ gridTemplateColumns: `repeat(${Math.min(columnOrder.length, 3)}, minmax(0, 1fr))` }}>
              {columnOrder.map(status => {
                const items = grouped.get(status) ?? [];
                const sc = getStatusColor(status);
                return (
                  <div key={status}>
                    {/* Column header */}
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: sc.dot }} />
                      <span className="text-[11px] font-medium" style={{ color: sc.text }}>{status}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto"
                        style={{ background: sc.bg, color: sc.text }}>
                        {items.length}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="space-y-2">
                      {items.length === 0 ? (
                        <div className="text-[10px] text-[#777] py-4 text-center border border-dashed border-[#333] rounded-lg">
                          Empty
                        </div>
                      ) : (
                        items.map(item => <ItemCard key={item.id} item={item} />)
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
