import { ExternalLink, GitBranch, LayoutGrid, Target, XCircle } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { PRODUCTS } from "@/lib/products";
import { getProductRepos } from "@/lib/local";

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

export default function ProductsPage() {
  const sidebarProjects = getProductRepos().map(r => ({
    name: r.name,
    url: `https://github.com/${r.owner}/${r.name}`,
  }));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#111111" }}>
      <Sidebar projects={sidebarProjects} />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 space-y-8">
          {/* Header */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#444] mb-0.5">Products</div>
            <div className="text-sm text-[#666]">{PRODUCTS.length} launched products</div>
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
        </div>
      </main>
    </div>
  );
}
