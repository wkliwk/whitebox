"use client";

import { useState } from "react";
import { ChevronRight, ExternalLink, KanbanSquare } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { GitHubIcon } from "./GitHubIcon";

interface Repo {
  name: string;
  url: string;
}

interface ProductGroup {
  name: string;
  color: string;
  boardNumber: number;
  repos: Repo[];
}

// Check if a repo is in the locally-discovered list
function matchesLocal(repoName: string, localRepos: { name: string }[]): boolean {
  return localRepos.some(r => r.name.toLowerCase() === repoName.toLowerCase());
}

interface SidebarProjectsProps {
  projects?: { name: string; url: string }[];
  productGroups?: ProductGroup[];
}

export function SidebarProjects({ projects = [], productGroups = [] }: SidebarProjectsProps) {
  // Start with all products collapsed
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { t } = useLanguage();

  function toggle(name: string) {
    setExpanded(prev => ({ ...prev, [name]: !prev[name] }));
  }

  return (
      <div className="space-y-0.5">
        {productGroups.map(product => {
          const isOpen = !!expanded[product.name];
          // Highlight if any of its repos are locally cloned
          const hasLocal = product.repos.some(r => matchesLocal(r.name, projects));

          return (
            <div key={product.name}>
              {/* Product row */}
              <button
                onClick={() => toggle(product.name)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#242424] transition-colors group"
              >
                {/* Expand chevron */}
                <ChevronRight
                  size={11}
                  className="shrink-0 transition-transform"
                  style={{
                    transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                    color: isOpen ? product.color : "#666",
                  }}
                />
                {/* Color dot */}
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: hasLocal ? product.color : "#555" }}
                />
                <span
                  className="flex-1 text-left text-xs truncate"
                  style={{ color: isOpen ? product.color : (hasLocal ? "#999" : "#555") }}
                >
                  {product.name}
                </span>
                {/* GitHub shortcut on hover */}
                <a
                  href={`https://github.com/users/wkliwk/projects/${product.boardNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Open GitHub project"
                >
                  <GitHubIcon className="w-2.5 h-2.5" style={{ color: product.color + "88" }} />
                </a>
              </button>

              {/* Submenu */}
              {isOpen && (
                <div className="ml-5 mt-0.5 space-y-0.5 mb-1">
                  {/* Board link as first item */}
                  <a
                    href={`https://github.com/users/wkliwk/projects/${product.boardNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#242424] transition-colors"
                  >
                    <KanbanSquare size={11} style={{ color: product.color }} className="shrink-0" />
                    <span className="text-[11px]" style={{ color: product.color + "cc" }}>
                      {t("products_board")}
                    </span>
                  </a>

                  {/* Repo links */}
                  {product.repos.map(repo => {
                    const isLocal = matchesLocal(repo.name, projects);
                    return (
                      <a
                        key={repo.name}
                        href={repo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#242424] transition-colors group/repo"
                      >
                        <GitHubIcon className="w-2.5 h-2.5 shrink-0" style={{ color: isLocal ? product.color + "88" : "#555" }} />
                        <span className={`text-[11px] flex-1 truncate ${isLocal ? "text-[#888]" : "text-[#777]"} group-hover/repo:text-[#888]`}>
                          {repo.name}
                        </span>
                        <ExternalLink size={9} className="shrink-0 opacity-0 group-hover/repo:opacity-100 text-[#888] transition-opacity" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
  );
}
