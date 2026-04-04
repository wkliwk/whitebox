"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Package, Users, LayoutDashboard, X, ArrowRight, Loader2 } from "lucide-react";

export interface SearchResult {
  type: "page" | "product" | "agent" | "issue" | "decision";
  title: string;
  subtitle: string;
  url: string;
  icon?: string;
}

interface SearchResponse {
  results: SearchResult[];
}

const TYPE_ORDER: SearchResult["type"][] = ["page", "product", "agent", "issue", "decision"];

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  page: "Pages",
  product: "Products",
  agent: "Agents",
  issue: "Issues",
  decision: "Decisions",
};

function TypeIcon({ type }: { type: SearchResult["type"] }) {
  const cls = "shrink-0";
  const size = 13;
  switch (type) {
    case "page":
      return <LayoutDashboard size={size} className={cls} />;
    case "product":
      return <Package size={size} className={cls} />;
    case "agent":
      return <Users size={size} className={cls} />;
    case "issue":
    case "decision":
      return <FileText size={size} className={cls} />;
  }
}

const EMPTY_PAGES: SearchResult[] = [
  { type: "page", title: "Dashboard", subtitle: "Live sessions, metrics, decisions", url: "/" },
  { type: "page", title: "Issues", subtitle: "All open issues across repos", url: "/issues" },
  { type: "page", title: "Board", subtitle: "Kanban view of all project boards", url: "/board" },
  { type: "page", title: "Products", subtitle: "Product registry + ideas pipeline", url: "/products" },
  { type: "page", title: "Teams", subtitle: "Agent org chart", url: "/teams" },
  { type: "page", title: "Logs", subtitle: "Loop log + decision log + activity", url: "/logs" },
  { type: "page", title: "Tools", subtitle: "MCP server inventory", url: "/tools" },
  { type: "page", title: "Schedule", subtitle: "Cron jobs + launchd", url: "/schedule" },
  { type: "page", title: "About", subtitle: "System architecture", url: "/about" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Open/close with Cmd+K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Focus input when opened, reset when closed
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
    }
  }, [open]);

  // Debounced search
  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) throw new Error("Search failed");
      const data: SearchResponse = await res.json();
      setResults(data.results);
      setActiveIndex(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  // Displayed items — show recent pages when no query
  const displayResults = query.trim() ? results : EMPTY_PAGES;

  function navigate(url: string) {
    setOpen(false);
    router.push(url);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, displayResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const item = displayResults[activeIndex];
      if (item) navigate(item.url);
    }
  }

  // Group results by type
  const grouped: Partial<Record<SearchResult["type"], SearchResult[]>> = {};
  for (const result of displayResults) {
    if (!grouped[result.type]) grouped[result.type] = [];
    grouped[result.type]!.push(result);
  }
  const groupOrder = TYPE_ORDER.filter(t => grouped[t]?.length);

  // Flat ordered list for active index tracking
  const flatList: SearchResult[] = groupOrder.flatMap(t => grouped[t] ?? []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
      aria-modal="true"
      role="dialog"
      aria-label="Command palette"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Palette container */}
      <div
        className="relative w-full max-w-xl mx-4 rounded-xl overflow-hidden shadow-2xl"
        style={{ background: "#1a1a1a", border: "1px solid #2e2e2e" }}
      >
        {/* Search input row */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid #2a2a2a" }}
        >
          {loading ? (
            <Loader2 size={15} className="text-[#666] shrink-0 animate-spin" />
          ) : (
            <Search size={15} className="text-[#666] shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages, products, agents..."
            className="flex-1 bg-transparent text-sm text-[#e8e8e8] placeholder-[#555] outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="text-[#666] hover:text-[#999] transition-colors"
            >
              <X size={13} />
            </button>
          )}
          <kbd className="hidden sm:flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-[#555]"
            style={{ border: "1px solid #333", background: "#161616" }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {displayResults.length === 0 && !loading && query.trim() && (
            <div className="px-4 py-8 text-center text-sm text-[#555]">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {!query.trim() && (
            <div className="px-4 pt-3 pb-1">
              <span className="text-[10px] uppercase tracking-widest text-[#555] font-medium">
                Pages
              </span>
            </div>
          )}

          {query.trim()
            ? groupOrder.map(type => {
                const items = grouped[type] ?? [];
                return (
                  <div key={type}>
                    <div className="px-4 pt-3 pb-1">
                      <span className="text-[10px] uppercase tracking-widest text-[#555] font-medium">
                        {TYPE_LABELS[type]}
                      </span>
                    </div>
                    {items.map(item => {
                      const flatIdx = flatList.indexOf(item);
                      const isActive = flatIdx === activeIndex;
                      return (
                        <ResultRow
                          key={`${item.type}-${item.url}-${item.title}`}
                          item={item}
                          isActive={isActive}
                          onClick={() => navigate(item.url)}
                          onMouseEnter={() => setActiveIndex(flatIdx)}
                        />
                      );
                    })}
                  </div>
                );
              })
            : flatList.map((item, idx) => (
                <ResultRow
                  key={`${item.type}-${item.url}`}
                  item={item}
                  isActive={idx === activeIndex}
                  onClick={() => navigate(item.url)}
                  onMouseEnter={() => setActiveIndex(idx)}
                />
              ))}
        </div>

        {/* Footer hint */}
        <div
          className="flex items-center gap-4 px-4 py-2.5 text-[10px] text-[#444]"
          style={{ borderTop: "1px solid #222" }}
        >
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded" style={{ border: "1px solid #333", background: "#161616" }}>↑</kbd>
            <kbd className="px-1 rounded" style={{ border: "1px solid #333", background: "#161616" }}>↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded" style={{ border: "1px solid #333", background: "#161616" }}>↵</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded" style={{ border: "1px solid #333", background: "#161616" }}>ESC</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}

interface ResultRowProps {
  item: SearchResult;
  isActive: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

function ResultRow({ item, isActive, onClick, onMouseEnter }: ResultRowProps) {
  const rowRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isActive) {
      rowRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [isActive]);

  return (
    <button
      ref={rowRef}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group"
      style={{
        background: isActive ? "#242424" : "transparent",
        color: isActive ? "#e8e8e8" : "#999",
      }}
    >
      <span style={{ color: isActive ? "#888" : "#555" }}>
        <TypeIcon type={item.type} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm truncate" style={{ color: isActive ? "#e8e8e8" : "#bbb" }}>
          {item.title}
        </span>
        {item.subtitle && (
          <span className="block text-[11px] truncate" style={{ color: isActive ? "#777" : "#555" }}>
            {item.subtitle}
          </span>
        )}
      </span>
      <ArrowRight
        size={12}
        className="shrink-0 transition-opacity"
        style={{ opacity: isActive ? 1 : 0, color: "#666" }}
      />
    </button>
  );
}
