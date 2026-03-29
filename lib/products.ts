import { getRegistryProducts } from "./local";

export interface ProductDef {
  id: string;
  name: string;
  tagline: string;
  description: string;
  platform: "web" | "mobile" | "extension" | "dashboard" | "cli";
  color: string;
  repos: { label: string; owner: string; name: string }[];
  boardNumber: number;
  goal: string;
  antiGoals: string[];
  status: "active" | "wip" | "paused";
  /** Live production URL, if deployed */
  productionUrl?: string;
}

const PALETTE = ["#ec4899", "#f97316", "#22c55e", "#eab308", "#8b5cf6", "#06b6d4", "#3b82f6", "#6366f1"];

function colorForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/** Rich metadata for known products — supplements registry data */
const RICH: Record<string, Partial<ProductDef>> = {
  "money-flow": {
    tagline: "Personal finance, simplified",
    description: "Expense tracking PWA — clean UI, no over-engineering.",
    color: "#ec4899",
    goal: "Help users understand where their money goes with the least friction possible.",
    antiGoals: ["No bank integrations", "No AI spending advice", "No social features"],
    status: "active",
    productionUrl: "https://money-flow-frontend-ten.vercel.app/",
  },
  "money-flow-mobile": {
    tagline: "Money Flow on the go",
    description: "React Native / Expo mobile app. Same backend API, native mobile UI.",
    color: "#f97316",
    goal: "Bring Money Flow to mobile with a native feel, reusing the existing backend.",
    antiGoals: ["No separate data sync", "No push notifications v1"],
    status: "wip",
  },
  "formpilot": {
    tagline: "AI that fills forms for you",
    description: "Browser extension that parses PDF, Word, and web forms and auto-fills from your profile.",
    color: "#22c55e",
    goal: "Eliminate the tedium of filling repetitive forms.",
    antiGoals: ["No storing sensitive documents server-side"],
    status: "wip",
    productionUrl: "https://formpilot-brown.vercel.app/",
  },
  "health-credit": {
    tagline: "Private health document sharing",
    description: "Encrypted upload and expiring link sharing for health documents.",
    color: "#eab308",
    goal: "Make private health document sharing safe and frictionless.",
    antiGoals: ["No storing unencrypted documents", "No identity verification v1"],
    status: "wip",
    productionUrl: "https://health-credit-frontend.vercel.app/",
  },
  "whitebox": {
    tagline: "See inside your AI agents",
    description: "Real-time ops dashboard for Claude Code agents.",
    color: "#8b5cf6",
    goal: "Full transparency into what every agent is doing at any moment.",
    antiGoals: ["No backend server — local reads only", "No auth"],
    status: "active",
  },
  "agentscore": {
    tagline: "AI agent reliability scoring",
    description: "Publish scored bundles, track agent quality over time. CLI + web dashboard.",
    color: "#3b82f6",
    goal: "Make AI agent quality measurable and comparable across teams.",
    antiGoals: ["No vendor lock-in", "No storing raw agent prompts"],
    status: "wip",
    productionUrl: "https://agent-score-seven.vercel.app/",
  },
  "pixsync": {
    tagline: "Unlimited Google Photos backup",
    description: "ADB-based photo relay — backs up photos via Pixel 1 auto-sync loophole.",
    color: "#06b6d4",
    goal: "Unlimited free Google Photos storage via automated Pixel 1 relay.",
    antiGoals: ["Personal use only", "No cloud server required"],
    status: "active",
  },
};

function normId(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

// ── Fallback if registry file is missing — declared BEFORE PRODUCTS so it's
//    initialized before buildProducts() runs (avoids TDZ on Vercel where the
//    registry file is absent and the fallback branch actually executes).
const HARDCODED_FALLBACK: ProductDef[] = [
  {
    id: "money-flow",
    name: "Money Flow",
    tagline: "Personal finance, simplified",
    description: "Expense tracking PWA — clean UI, no over-engineering.",
    platform: "web",
    color: "#ec4899",
    repos: [
      { label: "Frontend", owner: "wkliwk", name: "money-flow-frontend" },
      { label: "Backend",  owner: "wkliwk", name: "money-flow-backend" },
    ],
    boardNumber: 1,
    goal: "Help users understand where their money goes with the least friction possible.",
    antiGoals: ["No bank integrations", "No AI spending advice"],
    status: "active",
    productionUrl: "https://money-flow-frontend-ten.vercel.app/",
  },
  {
    id: "whitebox",
    name: "Whitebox",
    tagline: "See inside your AI agents",
    description: "Real-time ops dashboard for Claude Code agents.",
    platform: "dashboard",
    color: "#8b5cf6",
    repos: [{ label: "Dashboard", owner: "wkliwk", name: "whitebox" }],
    boardNumber: 8,
    goal: "Full transparency into what every agent is doing at any moment.",
    antiGoals: ["No backend server", "No auth"],
    status: "active",
  },
];

function buildProducts(): ProductDef[] {
  const registry = getRegistryProducts();
  if (registry.length === 0) return HARDCODED_FALLBACK;

  const repoLabels = ["Frontend", "Backend", "Mobile", "Extension", "CLI", "Dashboard"];
  const platformMap: Record<string, ProductDef["platform"]> = {
    web: "web", mobile: "mobile", "mobile (expo)": "mobile",
    extension: "extension", "web (extension)": "extension",
    dashboard: "dashboard", cli: "cli",
  };

  return registry.map(r => {
    const id = normId(r.name);
    const rich = RICH[id] ?? {};
    const repos = r.repos.map((repo, j) => ({
      label: repoLabels[j] ?? repo.name,
      owner: repo.owner,
      name: repo.name,
    }));

    return {
      id,
      name: r.name,
      tagline: rich.tagline ?? r.context.split("—")[0].trim(),
      description: rich.description ?? r.context,
      platform: platformMap[r.platform.toLowerCase()] ?? "web",
      color: rich.color ?? colorForName(r.name),
      repos,
      boardNumber: r.boardNumber,
      goal: rich.goal ?? r.context,
      antiGoals: rich.antiGoals ?? [],
      status: rich.status ?? "wip",
      productionUrl: rich.productionUrl,
    } satisfies ProductDef;
  });
}

export const PRODUCTS: ProductDef[] = buildProducts();

export function getProduct(id: string): ProductDef | undefined {
  return PRODUCTS.find(p => p.id === id);
}
