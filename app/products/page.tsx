import { ExternalLink, GitBranch, LayoutGrid, Target, XCircle, Lightbulb, Globe, Monitor } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { PRODUCTS } from "@/lib/products";
import { getProductRepos } from "@/lib/local";
import { getProjectBoard } from "@/lib/projects";
import { getOpenIssueCountsForRepos } from "@/lib/github";
import { getDeploymentStatuses, deployStateColor, deployStateLabel } from "@/lib/vercel";
import { GitHubIcon } from "@/components/GitHubIcon";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products — Whitebox",
};

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
  const allRepos = PRODUCTS.flatMap(p => p.repos);
  const productionUrls = PRODUCTS.map(p => p.productionUrl).filter((u): u is string => !!u);
  const [sidebarProjects, ideasBoard, issueCounts, deployStatuses] = await Promise.all([
    Promise.resolve(getProductRepos().map(r => ({
      name: r.name,
      url: `https://github.com/${r.owner}/${r.name}`,
    }))),
    getProjectBoard(3),
    getOpenIssueCountsForRepos(allRepos),
    getDeploymentStatuses(productionUrls),
  ]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#111111" }}>
      <Sidebar projects={sidebarProjects} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-8">
          {/* Header */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888] mb-0.5">Products</div>
            <div className="text-sm text-[#888]">
              {PRODUCTS.length} launched
              {ideasBoard && ideasBoard.items.length > 0 && (
                <span className="text-[#777] ml-2">· {ideasBoard.items.length} ideas in pipeline</span>
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
                    <a
                      href={product.repos[0] ? `https://github.com/${product.repos[0].owner}/${product.repos[0].name}` : `https://github.com/users/wkliwk/projects/${product.boardNumber}`}
                      target="_blank" rel="noreferrer"
                      className="w-9 h-9 rounded flex items-center justify-center text-sm font-bold flex-shrink-0 hover:opacity-80 transition-opacity"
                      style={{ background: product.color + "22", color: product.color }}>
                      {product.name[0]}
                    </a>
                    <div>
                      <div className="flex items-center gap-2">
                        <a
                          href={product.repos[0] ? `https://github.com/${product.repos[0].owner}/${product.repos[0].name}` : `https://github.com/users/wkliwk/projects/${product.boardNumber}`}
                          target="_blank" rel="noreferrer"
                          className="text-sm font-semibold text-[#e8e8e8] hover:text-white transition-colors">
                          {product.name}
                        </a>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{ background: statusColor[product.status] + "22", color: statusColor[product.status] }}>
                          {statusLabel[product.status]}
                        </span>
                        {(() => {
                          const total = product.repos.reduce((sum, r) => sum + (issueCounts[`${r.owner}/${r.name}`] ?? 0), 0);
                          if (total === 0) return null;
                          return (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-[#1e1e1e] text-[#666]">
                              {total} open
                            </span>
                          );
                        })()}
                      </div>
                      <div className="text-xs text-[#888] mt-0.5">{product.tagline}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-[#888]">
                      {platformLabel[product.platform]}
                    </span>
                    <a href={`https://github.com/users/wkliwk/projects/${product.boardNumber}`}
                      target="_blank" rel="noreferrer"
                      className="text-[#777] hover:text-[#888] transition-colors"
                      title={`Board #${product.boardNumber}`}>
                      <GitHubIcon className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-[#999] leading-relaxed">{product.description}</p>

                {/* Goal */}
                <div className="flex items-start gap-2">
                  <Target size={11} className="text-[#888] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#888] leading-relaxed">{product.goal}</p>
                </div>

                {/* Anti-goals */}
                {product.antiGoals.length > 0 && (
                  <div className="space-y-1">
                    {product.antiGoals.map((ag, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <XCircle size={10} className="text-[#777] shrink-0" />
                        <span className="text-[10px] text-[#888]">{ag}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer: production link + repos + board */}
                <div className="flex items-center gap-3 pt-1 flex-wrap">
                  {product.productionUrl && (() => {
                    const state = deployStatuses[product.productionUrl];
                    const dotColor = deployStateColor(state);
                    const label = deployStateLabel(state);
                    return (
                      <a href={product.productionUrl}
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-[10px] text-[#777] hover:text-[#999] transition-colors"
                        title={label || undefined}>
                        {state ? (
                          <span className="relative flex w-2 h-2 shrink-0">
                            {state === "READY" && (
                              <span className="absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping" style={{ background: dotColor }} />
                            )}
                            <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: dotColor }} />
                          </span>
                        ) : (
                          <Globe size={10} />
                        )}
                        <span>Live</span>
                        <ExternalLink size={8} className="text-[#777]" />
                      </a>
                    );
                  })()}
                  {process.env.NODE_ENV === "development" && product.localhostPort && (
                    <a href={`http://localhost:${product.localhostPort}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-[10px] transition-colors"
                      style={{ color: product.color + "cc" }}
                      title={`Open local dev server on port ${product.localhostPort}`}>
                      <Monitor size={10} />
                      <span>:{product.localhostPort}</span>
                    </a>
                  )}
                  {product.repos.map(repo => (
                    <a key={repo.name}
                      href={`https://github.com/${repo.owner}/${repo.name}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-[10px] text-[#777] hover:text-[#999] transition-colors">
                      <GitBranch size={10} />
                      <span>{repo.label}</span>
                      <ExternalLink size={8} className="text-[#777]" />
                    </a>
                  ))}
                  <a href={`https://github.com/users/wkliwk/projects/${product.boardNumber}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-[10px] text-[#777] hover:text-[#999] transition-colors ml-auto">
                    <LayoutGrid size={10} />
                    <span>Board #{product.boardNumber}</span>
                    <ExternalLink size={8} className="text-[#777]" />
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
                <div className="text-[10px] uppercase tracking-widest text-[#888] font-medium">Ideas Pipeline</div>
                <a href={ideasBoard.url} target="_blank" rel="noreferrer"
                  className="ml-auto text-[10px] text-[#777] hover:text-[#888] flex items-center gap-1 transition-colors">
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
                        <span className="text-[10px] text-[#777]">{group.length}</span>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                        {group.map(idea => {
                          const inner = (
                            <>
                              {idea.number && (
                                <span className="text-[10px] text-[#555] shrink-0 mt-0.5 font-mono">#{idea.number}</span>
                              )}
                              <span className="text-xs text-[#888] group-hover:text-[#999] transition-colors leading-relaxed flex-1">
                                {idea.title}
                              </span>
                              {idea.url && <ExternalLink size={9} className="text-[#2a2a2a] group-hover:text-[#777] shrink-0 mt-0.5 transition-colors" />}
                            </>
                          );
                          return idea.url ? (
                            <a key={idea.id} href={idea.url} target="_blank" rel="noreferrer"
                              className="flex items-start gap-3 p-3 rounded-lg border border-[#2a2a2a] hover:border-[#2a2a2a] transition-colors group"
                              style={{ background: "#161616" }}>
                              {inner}
                            </a>
                          ) : (
                            <div key={idea.id}
                              className="flex items-start gap-3 p-3 rounded-lg border border-[#2a2a2a] group"
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
              <div className="text-xs text-[#888]">Ideas pipeline unavailable</div>
              <div className="text-[10px] text-[#2a2a2a] mt-1">Set GITHUB_TOKEN in .env.local</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
