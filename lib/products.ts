export interface ProductDef {
  id: string;
  name: string;
  tagline: string;
  description: string;
  platform: "web" | "mobile" | "extension" | "dashboard";
  color: string;
  repos: { label: string; owner: string; name: string }[];
  boardNumber: number;
  goal: string;
  antiGoals: string[];
  status: "active" | "wip" | "paused";
}

export const PRODUCTS: ProductDef[] = [
  {
    id: "money-flow",
    name: "Money Flow",
    tagline: "Personal finance, simplified",
    description: "Expense tracking PWA — clean UI, no over-engineering. Simple income/expense logging with category breakdowns and monthly summaries.",
    platform: "web",
    color: "#ec4899",
    repos: [
      { label: "Frontend", owner: "wkliwk", name: "money-flow-frontend" },
      { label: "Backend", owner: "wkliwk", name: "money-flow-backend" },
    ],
    boardNumber: 1,
    goal: "Help users understand where their money goes with the least friction possible.",
    antiGoals: ["No bank integrations", "No AI spending advice", "No social features"],
    status: "active",
  },
  {
    id: "money-flow-mobile",
    name: "Money Flow Mobile",
    tagline: "Money Flow on the go",
    description: "React Native / Expo mobile app for Money Flow. Same backend API, native mobile UI.",
    platform: "mobile",
    color: "#f97316",
    repos: [
      { label: "Mobile", owner: "wkliwk", name: "money-flow-mobile" },
    ],
    boardNumber: 1,
    goal: "Bring Money Flow to mobile with a native feel, reusing the existing backend.",
    antiGoals: ["No separate data sync", "No push notifications v1"],
    status: "wip",
  },
  {
    id: "formpilot",
    name: "FormPilot",
    tagline: "AI that fills forms for you",
    description: "Browser extension that parses PDF, Word, and web forms — explains each field and auto-fills from your saved profile.",
    platform: "extension",
    color: "#22c55e",
    repos: [
      { label: "Extension", owner: "wkliwk", name: "FormPilot" },
    ],
    boardNumber: 6,
    goal: "Eliminate the tedium of filling repetitive forms by understanding them and doing it for you.",
    antiGoals: ["No storing sensitive documents server-side", "No subscription required for basic use"],
    status: "wip",
  },
  {
    id: "health-credit",
    name: "Health Credit",
    tagline: "Private health document sharing",
    description: "Encrypted upload and expiring link sharing for health documents. Sub-vertical: HC Trust for sexual health records between partners.",
    platform: "web",
    color: "#eab308",
    repos: [
      { label: "Frontend", owner: "wkliwk", name: "health-credit-frontend" },
      { label: "Backend", owner: "wkliwk", name: "health-credit-backend" },
    ],
    boardNumber: 7,
    goal: "Make private health document sharing safe and frictionless, starting with sexual health.",
    antiGoals: ["No storing unencrypted documents", "No identity verification v1"],
    status: "wip",
  },
  {
    id: "whitebox",
    name: "Whitebox",
    tagline: "See inside your AI agents",
    description: "Real-time ops dashboard for Claude Code agents. Live session detection, decision log, token usage, task tracking — all from your local machine.",
    platform: "dashboard",
    color: "#8b5cf6",
    repos: [
      { label: "Dashboard", owner: "wkliwk", name: "whitebox" },
    ],
    boardNumber: 8,
    goal: "Full transparency into what every agent is doing at any moment.",
    antiGoals: ["No backend server — local reads only", "No auth", "No complex state management"],
    status: "active",
  },
];

export function getProduct(id: string): ProductDef | undefined {
  return PRODUCTS.find(p => p.id === id);
}
