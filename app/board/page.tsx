import { ExternalLink } from "lucide-react";
import { GitHubIcon } from "@/components/GitHubIcon";
import { Sidebar } from "@/components/Sidebar";
import { getProductRepos } from "@/lib/local";
import { getProjectBoard, BOARD_DEFS } from "@/lib/projects";
import type { BoardItem } from "@/lib/projects";

export const revalidate = 30;

const STATUS_ORDER = ["Todo", "In Progress", "Done"];

const statusColors: Record<string, { dot: string; text: string; bg: string }> = {
  "Todo":        { dot: "#3b82f6", text: "#3b82f6", bg: "#3b82f611" },
  "In Progress": { dot: "#eab308", text: "#eab308", bg: "#eab30811" },
  "Done":        { dot: "#22c55e", text: "#22c55e", bg: "#22c55e11" },
};

const priorityColors: Record<string, string> = {
  p0: "#ef4444", p1: "#f97316", p2: "#555",
};

const agentColors: Record<string, string> = {
  ceo: "#8b5cf6", pm: "#3b82f6", dev: "#06b6d4", qa: "#22c55e",
  ops: "#eab308", designer: "#ec4899", finance: "#6366f1",
  "frontend-dev": "#06b6d4", "backend-dev": "#3b82f6",
};

function ItemCard({ item }: { item: BoardItem }) {
  const agentColor = agentColors[item.agent] ?? "#444";
  const prioColor = priorityColors[item.priority] ?? "#555";

  return (
    <a href={item.url} target="_blank" rel="noreferrer"
      className="block p-3 rounded-lg border border-[#222] hover:border-[#333] transition-colors group"
      style={{ background: "#1a1a1a" }}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-[10px] text-[#444] shrink-0">#{item.number}</span>
        <ExternalLink size={10} className="text-[#2a2a2a] group-hover:text-[#555] shrink-0 mt-0.5 transition-colors" />
      </div>
      <p className="text-xs text-[#ccc] leading-relaxed mb-2 group-hover:text-[#e8e8e8] transition-colors">
        {item.title}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        {item.repo && (
          <span className="text-[9px] text-[#444] bg-[#222] px-1.5 py-0.5 rounded truncate max-w-[90px]">
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
          <span className="text-[9px] text-[#333] bg-[#1e1e1e] px-1.5 py-0.5 rounded ml-auto">
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

  // Group items by status
  const grouped = new Map<string, BoardItem[]>();
  for (const status of STATUS_ORDER) grouped.set(status, []);

  if (boardData) {
    for (const item of boardData.items) {
      const key = STATUS_ORDER.find(s => item.status.toLowerCase().includes(s.toLowerCase())) ?? "Todo";
      grouped.get(key)?.push(item);
    }
  }

  const activeDef = BOARD_DEFS.find(b => b.number === activeBoardNumber);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#111111" }}>
      <Sidebar projects={sidebarProjects} />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#444] mb-0.5">Board</div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-[#e8e8e8]">
                  {boardData?.title ?? activeDef?.label ?? `Project ${activeBoardNumber}`}
                </h1>
                {boardData && (
                  <a href={boardData.url} target="_blank" rel="noreferrer"
                    className="text-[10px] text-[#444] hover:text-[#888] flex items-center gap-1">
                    <GitHubIcon className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Item count badge */}
            {boardData && (
              <div className="text-[10px] text-[#555]">
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
              <div className="text-xs text-[#555] mb-1">Board data unavailable</div>
              <div className="text-[10px] text-[#333]">Configure GITHUB_TOKEN in .env.local to enable this page</div>
            </div>
          ) : !boardData ? (
            <div className="py-12 text-center">
              <div className="text-xs text-[#555] mb-1">Could not load board</div>
              <div className="text-[10px] text-[#333]">Board {activeBoardNumber} may not exist or is inaccessible</div>
            </div>
          ) : (
            /* Kanban columns */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {STATUS_ORDER.map(status => {
                const items = grouped.get(status) ?? [];
                const sc = statusColors[status] ?? { dot: "#555", text: "#555", bg: "#55511" };
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
                        <div className="text-[10px] text-[#555] py-4 text-center border border-dashed border-[#2a2a2a] rounded-lg">
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
