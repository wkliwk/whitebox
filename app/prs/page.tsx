import Link from "next/link";
import { GitPullRequest, GitPullRequestDraft } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { getProductRepos } from "@/lib/local";
import { getOpenPRs } from "@/lib/github";
import { PRODUCTS } from "@/lib/products";
import { relativeTime } from "@/lib/utils";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PRs — Whitebox",
};

export const revalidate = 60;

export default async function PRsPage() {
  const [prs, repos] = await Promise.all([
    getOpenPRs(),
    Promise.resolve(getProductRepos()),
  ]);

  const sidebarProjects = repos.map(r => ({
    name: r.name,
    url: `https://github.com/${r.owner}/${r.name}`,
  }));

  // Build color map from PRODUCTS
  const repoColor = new Map<string, string>();
  for (const p of PRODUCTS) {
    for (const r of p.repos) repoColor.set(r.name, p.color);
  }

  const ready = prs.filter(p => !p.draft);
  const drafts = prs.filter(p => p.draft);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#111111" }}>
      <Sidebar projects={sidebarProjects} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-8">
          {/* Header */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888] mb-0.5">Pull Requests</div>
            <div className="text-sm text-[#888]">
              {ready.length} ready · {drafts.length} draft{drafts.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Open", count: prs.length, color: "#3b82f6" },
              { label: "Ready", count: ready.length, color: "#22c55e" },
              { label: "Draft", count: drafts.length, color: "#888" },
            ].map(s => (
              <div key={s.label} className="rounded-lg p-4 border border-[#222]" style={{ background: "#1c1c1c" }}>
                <div className="text-2xl font-bold tabular-nums" style={{ color: s.color }}>{s.count}</div>
                <div className="text-[10px] uppercase tracking-widest text-[#777] mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* PR list */}
          {prs.length === 0 ? (
            <div className="rounded-xl border border-[#222] bg-[#161616] p-8 text-center">
              <div className="text-xs text-[#555]">No open pull requests across tracked repos</div>
            </div>
          ) : (
            <div className="rounded-xl border border-[#222] bg-[#161616] overflow-hidden">
              {prs.map((pr, i) => {
                const color = repoColor.get(pr.repo) ?? "#555";
                return (
                  <div
                    key={`${pr.repo}-${pr.number}`}
                    className="flex items-start gap-3 px-5 py-3.5 border-b border-[#1e1e1e] last:border-0 hover:bg-[#1a1a1a] transition-colors"
                  >
                    {/* Status icon */}
                    <div className="shrink-0 mt-0.5">
                      {pr.draft
                        ? <GitPullRequestDraft size={14} style={{ color: "#555" }} />
                        : <GitPullRequest size={14} style={{ color: "#3b82f6" }} />
                      }
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0"
                          style={{ background: color + "18", color }}
                        >
                          {pr.repo}
                        </span>
                        {pr.draft && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-[#2a2a2a] text-[#666]">
                            Draft
                          </span>
                        )}
                        <span className="text-[10px] text-[#555]">#{pr.number}</span>
                      </div>
                      <Link
                        href={pr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-xs leading-snug hover:text-[#e8e8e8] transition-colors ${pr.draft ? "text-[#666]" : "text-[#ccc]"}`}
                      >
                        {pr.title}
                      </Link>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-[#555]">{pr.author}</span>
                        {pr.reviewComments > 0 && (
                          <span className="text-[10px] text-[#555]">
                            {pr.reviewComments} comment{pr.reviewComments !== 1 ? "s" : ""}
                          </span>
                        )}
                        <span className="text-[10px] text-[#444]">{relativeTime(pr.updatedAt)}</span>
                      </div>
                    </div>

                    {/* GitHub link */}
                    <Link
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-[10px] text-[#444] hover:text-[#888] transition-colors mt-0.5"
                    >
                      ↗
                    </Link>
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
