"use client";

import { useState } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";
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

// Static product definitions matching product-registry.md
const PRODUCTS: ProductGroup[] = [
  {
    name: "Money Flow",
    color: "#ec4899",
    boardNumber: 1,
    repos: [
      { name: "money-flow-frontend", url: "https://github.com/wkliwk/money-flow-frontend" },
      { name: "money-flow-backend",  url: "https://github.com/wkliwk/money-flow-backend"  },
      { name: "money-flow-mobile",   url: "https://github.com/wkliwk/money-flow-mobile"   },
    ],
  },
  {
    name: "FormPilot",
    color: "#22c55e",
    boardNumber: 6,
    repos: [
      { name: "FormPilot", url: "https://github.com/wkliwk/FormPilot" },
    ],
  },
  {
    name: "Health Credit",
    color: "#eab308",
    boardNumber: 7,
    repos: [
      { name: "health-credit-frontend", url: "https://github.com/wkliwk/health-credit-frontend" },
      { name: "health-credit-backend",  url: "https://github.com/wkliwk/health-credit-backend"  },
    ],
  },
  {
    name: "Whitebox",
    color: "#8b5cf6",
    boardNumber: 8,
    repos: [
      { name: "whitebox", url: "https://github.com/wkliwk/whitebox" },
    ],
  },
  {
    name: "AgentScore",
    color: "#3b82f6",
    boardNumber: 5,
    repos: [
      { name: "agent-score", url: "https://github.com/wkliwk/agent-score" },
    ],
  },
  {
    name: "PixSync",
    color: "#06b6d4",
    boardNumber: 9,
    repos: [
      { name: "pixsync", url: "https://github.com/wkliwk/pixsync" },
    ],
  },
];

// Check if a repo is in the locally-discovered list
function matchesLocal(repoName: string, localRepos: { name: string }[]): boolean {
  return localRepos.some(r => r.name.toLowerCase() === repoName.toLowerCase());
}

interface SidebarProjectsProps {
  projects?: { name: string; url: string }[];
}

export function SidebarProjects({ projects = [] }: SidebarProjectsProps) {
  // Start with all products collapsed
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { t } = useLanguage();

  function toggle(name: string) {
    setExpanded(prev => ({ ...prev, [name]: !prev[name] }));
  }

  return (
    <div className="px-2 py-2">
      <div className="text-[10px] uppercase tracking-widest text-[#444] mb-2 px-2 font-medium">{t("section_products")}</div>
      <div className="space-y-0.5">
        {PRODUCTS.map(product => {
          const isOpen = !!expanded[product.name];
          // Highlight if any of its repos are locally cloned
          const hasLocal = product.repos.some(r => matchesLocal(r.name, projects));

          return (
            <div key={product.name}>
              {/* Product row */}
              <button
                onClick={() => toggle(product.name)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#1e1e1e] transition-colors group"
              >
                {/* Expand chevron */}
                <ChevronRight
                  size={11}
                  className="shrink-0 transition-transform"
                  style={{
                    transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                    color: isOpen ? product.color : "#444",
                  }}
                />
                {/* Color dot */}
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: hasLocal ? product.color : "#333" }}
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
                    className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#1e1e1e] transition-colors"
                  >
                    <GitHubIcon className="w-2.5 h-2.5" style={{ color: product.color }} />
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
                        className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#1e1e1e] transition-colors group/repo"
                      >
                        <span
                          className="w-1 h-1 rounded-full shrink-0"
                          style={{ background: isLocal ? product.color + "88" : "#2a2a2a" }}
                        />
                        <span className={`text-[11px] flex-1 truncate ${isLocal ? "text-[#666]" : "text-[#3a3a3a]"} group-hover/repo:text-[#888]`}>
                          {repo.name}
                        </span>
                        <ExternalLink size={9} className="shrink-0 opacity-0 group-hover/repo:opacity-100 text-[#444] transition-opacity" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
