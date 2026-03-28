import { ExternalLink, GitBranch, LayoutGrid, Target, XCircle, Lightbulb } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { PRODUCTS } from "@/lib/products";
import { getProductRepos } from "@/lib/local";
import { getProjectBoard } from "@/lib/projects";
import { GitHubIcon } from "@/components/GitHubIcon";

export const revalidate = 60;

const platformLabel: Record<string, string> = {
  web: "Web",
  mobile: "Mobile",
  extension: "Extension",
  dashboard: "Dashboard",
};

const statusLabel: Record<string, string> = {
  active: "Active",
  wip: "In Progress",
  paused: "Paused",
};

const statusColor: Record<string, string> = {
  active: "#22c55e",
  wip: "#3b82f6",
  paused: "#555",
};

const ideaStatusColors: Record<string, { text: string; bg: string }> = {
  "Todo":        { text: "#6b7280", bg: "#6b728018" },
  "In Progress": { text: "#f97316", bg: "#f9731618" },
  "Done":        { text: "#22c55e", bg: "#22c55e18" },
};

function getIdeaStatusColor(status: string) {
  return ideaStatusColors[status] ?? { text: "#555", bg: "#55555518" };
}

export default async function ProductsPage() {
  const [sidebarProjects, ideasBoard] = await Promise.all([
    Promise.resolve(getProductRepos().map(r => ({
      name: r.name,
      url: `https://github.com/${r.owner}/${r.name}`,
    }))),
    getProjectBoard(3),
  ]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#111111" }}>
      <Sidebar projects={sidebarProjects} />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 space-y-8">
          {/* Header */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#444] mb-0.5">Products</div>
            <div className="text-sm text-[#666]">
              {PRODUCTS.length} launched
              {ideasBoard && ideasBoard.items.length > 0 && (
                <span className="text-[#3a3a3a] ml-2">· {ideasBoard.items.length} ideas in pipeline</span>
              )}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {PRODUCTS.map(product => (
              <div key={product.id}
                className="rounded-lg border border-[#222] p-5 space-y-4 hover:border-[#333] transition-colors"
                style={{ background: "#161616" }}>

                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: product.color + "22", color: product.color }}>
                      {product.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#e8e8e8]">{product.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{ background: statusColor[product.status] + "22", color: statusColor[product.status] }}>
                          {statusLabel[product.status]}
                        </span>
                      </div>
                      <div className="text-xs text-[#666] mt-0.5">{product.tagline}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#444] shrink-0 mt-1">
                    {platformLabel[product.platform]}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-[#999] leading-relaxed">{product.description}</p>

                {/* Goal */}
                <div className="flex items-start gap-2">
                  <Target size={11} className="text-[#444] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#666] leading-relaxed">{product.goal}</p>
                </div>

                {/* Anti-goals */}
                {product.antiGoals.length > 0 && (
                  <div className="space-y-1">
                    {product.antiGoals.map((ag, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <XCircle size={10} className="text-[#333] shrink-0" />
                        <span className="text-[10px] text-[#444]">{ag}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer: repos + board */}
                <div className="flex items-center gap-3 pt-1 flex-wrap">
                  {product.repos.map(repo => (
                    <a key={repo.name}
                      href={`https://github.com/${repo.owner}/${repo.name}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-[10px] text-[#555] hover:text-[#999] transition-colors">
                      <GitBranch size={10} />
                      <span>{repo.label}</span>
                      <ExternalLink size={8} className="text-[#333]" />
                    </a>
                  ))}
                  <a href={`https://github.com/users/wkliwk/projects/${product.boardNumber}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-[10px] text-[#555] hover:text-[#999] transition-colors ml-auto">
                    <LayoutGrid size={10} />
                    <span>Board #{product.boardNumber}</span>
                    <ExternalLink size={8} className="text-[#333]" />
                  </a>
                </div>
              </div>
            ))}
          </div>
          {/* Ideas Pipeline */}
          {ideasBoard && ideasBoard.items.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={13} className="text-[#f97316]" />
                <div className="text-[10px] uppercase tracking-widest text-[#444] font-medium">Ideas Pipeline</div>
                <a href={ideasBoard.url} target="_blank" rel="noreferrer"
                  className="ml-auto text-[10px] text-[#333] hover:text-[#666] flex items-center gap-1 transition-colors">
                  <GitHubIcon className="w-3 h-3" />
                  <span>View board</span>
                </a>
              </div>

              {/* Group by actual board status */}
              {(() => {
                const statusOrder = ["In Progress", "Todo"]; // "Done" intentionally excluded
                // Collect any statuses not in the known order
                const extra = [...new Set(ideasBoard.items.map(i => i.status))]
                  .filter(s => !statusOrder.includes(s));
                return [...statusOrder, ...extra].map(status => {
                  const group = ideasBoard.items.filter(i => i.status === status);
                  if (group.length === 0) return null;
                  const sc = getIdeaStatusColor(status);
                  return (
                    <div key={status} className="mb-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: sc.bg, color: sc.text }}>
                          {status}
                        </span>
                        <span className="text-[10px] text-[#333]">{group.length}</span>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                        {group.map(idea => {
                          const inner = (
                            <>
                              {idea.number && (
                                <span className="text-[10px] text-[#2a2a2a] shrink-0 mt-0.5 font-mono">#{idea.number}</span>
                              )}
                              <span className="text-xs text-[#666] group-hover:text-[#999] transition-colors leading-relaxed flex-1">
                                {idea.title}
                              </span>
                              {idea.url && <ExternalLink size={9} className="text-[#2a2a2a] group-hover:text-[#555] shrink-0 mt-0.5 transition-colors" />}
                            </>
                          );
                          return idea.url ? (
                            <a key={idea.id} href={idea.url} target="_blank" rel="noreferrer"
                              className="flex items-start gap-3 p-3 rounded-lg border border-[#1e1e1e] hover:border-[#2a2a2a] transition-colors group"
                              style={{ background: "#161616" }}>
                              {inner}
                            </a>
                          ) : (
                            <div key={idea.id}
                              className="flex items-start gap-3 p-3 rounded-lg border border-[#1e1e1e] group"
                              style={{ background: "#161616" }}>
                              {inner}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* No token fallback for ideas */}
          {!process.env.GITHUB_TOKEN && (
            <div className="border border-dashed border-[#1e1e1e] rounded-lg p-6 text-center">
              <Lightbulb size={16} className="text-[#2a2a2a] mx-auto mb-2" />
              <div className="text-xs text-[#444]">Ideas pipeline unavailable</div>
              <div className="text-[10px] text-[#2a2a2a] mt-1">Set GITHUB_TOKEN in .env.local</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
