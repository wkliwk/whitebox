/** Known agent colors — used as fallback when /api/agents hasn't loaded yet */
export const AGENT_COLORS: Record<string, string> = {
  ceo: "#8b5cf6",
  pm: "#3b82f6",
  "frontend-dev": "#06b6d4",
  "backend-dev": "#0ea5e9",
  "mobile-dev": "#14b8a6",
  qa: "#22c55e",
  ops: "#eab308",
  designer: "#ec4899",
  finance: "#6366f1",
  "ai-researcher": "#f97316",
  "claude-code-manager": "#a855f7",
};

export interface AgentDef {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  githubLabel: string;
}

export function getAgentColor(id: string): string {
  return AGENT_COLORS[id] ?? "#555";
}

/** Static agent list — used by components that don't need full AgentDef from API */
export const AGENTS = [
  { id: "ceo", name: "CEO", role: "Strategy & Idea Gating", color: AGENT_COLORS.ceo, githubLabel: "agent:ceo" },
  { id: "pm", name: "PM", role: "Planning & PRDs", color: AGENT_COLORS.pm, githubLabel: "agent:pm" },
  { id: "frontend-dev", name: "Frontend Dev", role: "React/TypeScript UI", color: AGENT_COLORS["frontend-dev"], githubLabel: "agent:frontend-dev" },
  { id: "backend-dev", name: "Backend Dev", role: "API/Database", color: AGENT_COLORS["backend-dev"], githubLabel: "agent:backend-dev" },
  { id: "mobile-dev", name: "Mobile Dev", role: "Expo/React Native", color: AGENT_COLORS["mobile-dev"], githubLabel: "agent:mobile-dev" },
  { id: "qa", name: "QA", role: "Code Review & Testing", color: AGENT_COLORS.qa, githubLabel: "agent:qa" },
  { id: "ops", name: "Ops", role: "CI/CD & Deploys", color: AGENT_COLORS.ops, githubLabel: "agent:ops" },
  { id: "designer", name: "Designer", role: "UI/UX Audits", color: AGENT_COLORS.designer, githubLabel: "agent:designer" },
  { id: "finance", name: "Finance", role: "Cost Management", color: AGENT_COLORS.finance, githubLabel: "agent:finance" },
] as const;
