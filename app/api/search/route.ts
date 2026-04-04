import { NextRequest, NextResponse } from "next/server";
import { withCache } from "@/lib/cache";
import { PRODUCTS } from "@/lib/products";
import { AGENTS } from "@/lib/agents";
import { getDecisions } from "@/lib/local";

export const dynamic = "force-dynamic";

export interface SearchResult {
  type: "page" | "product" | "agent" | "issue" | "decision";
  title: string;
  subtitle: string;
  url: string;
}

interface SearchResponse {
  results: SearchResult[];
}

const PAGES: SearchResult[] = [
  { type: "page", title: "Dashboard", subtitle: "Live sessions, metrics, decisions", url: "/" },
  { type: "page", title: "Issues", subtitle: "All open issues across repos", url: "/issues" },
  { type: "page", title: "Board", subtitle: "Kanban view of all project boards", url: "/board" },
  { type: "page", title: "Products", subtitle: "Product registry + ideas pipeline", url: "/products" },
  { type: "page", title: "Teams", subtitle: "Agent org chart", url: "/teams" },
  { type: "page", title: "Logs", subtitle: "Loop log + decision log + activity", url: "/logs" },
  { type: "page", title: "Tools", subtitle: "MCP server inventory", url: "/tools" },
  { type: "page", title: "Schedule", subtitle: "Cron jobs + launchd", url: "/schedule" },
  { type: "page", title: "About", subtitle: "System architecture", url: "/about" },
  { type: "page", title: "Pull Requests", subtitle: "Open PRs across all repos", url: "/prs" },
];

/** Simple fuzzy match — returns true if all characters of `needle` appear in
 *  order within `haystack` (case-insensitive). Also returns true for plain
 *  substring matches. */
function fuzzyMatch(haystack: string, needle: string): boolean {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase().trim();
  if (!n) return true;
  // Fast path: substring
  if (h.includes(n)) return true;
  // Fuzzy path: characters in order
  let hi = 0;
  for (let ni = 0; ni < n.length; ni++) {
    const ch = n[ni];
    if (ch === " ") continue; // skip spaces in needle for fuzzy
    const found = h.indexOf(ch, hi);
    if (found === -1) return false;
    hi = found + 1;
  }
  return true;
}

function matchesQuery(fields: string[], query: string): boolean {
  return fields.some(f => fuzzyMatch(f, query));
}

async function runSearch(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // Pages
  for (const page of PAGES) {
    if (matchesQuery([page.title, page.subtitle], query)) {
      results.push(page);
    }
  }

  // Products
  for (const product of PRODUCTS) {
    if (matchesQuery([product.name, product.tagline, product.description, product.id], query)) {
      results.push({
        type: "product",
        title: product.name,
        subtitle: product.tagline,
        url: `/products/${product.id}`,
      });
    }
  }

  // Agents
  for (const agent of AGENTS) {
    if (matchesQuery([agent.name, agent.id, agent.description, agent.category], query)) {
      results.push({
        type: "agent",
        title: agent.name,
        subtitle: agent.githubLabel,
        url: `/teams`,
      });
    }
  }

  // Decisions (capped at 10 results)
  try {
    const decisions = await getDecisions(100);
    let decisionCount = 0;
    for (const d of decisions) {
      if (decisionCount >= 10) break;
      if (matchesQuery([d.summary, d.project, d.prompt ?? ""], query)) {
        results.push({
          type: "decision",
          title: d.summary,
          subtitle: `${d.project} · ${d.date}`,
          url: "/logs",
        });
        decisionCount++;
      }
    }
  } catch {
    // Decisions unavailable — skip silently
  }

  return results;
}

export async function GET(req: NextRequest): Promise<NextResponse<SearchResponse>> {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const results = await withCache(
    `search:${q.toLowerCase()}`,
    30_000,
    () => runSearch(q)
  );

  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=10" } }
  );
}
