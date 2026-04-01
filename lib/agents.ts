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

export interface AgentLastTask {
  task: string;
  project: string;
  issueNumber?: number;
  issueRepo?: string;
  completedAt: string;
}

export interface AgentDef {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  githubLabel: string;
  lastTask?: AgentLastTask;
}

export function getAgentColor(id: string): string {
  return AGENT_COLORS[id] ?? "#555";
}

/** Static fallback list — prefer useAgents() hook for dynamic data */
export const AGENTS: AgentDef[] = Object.entries(AGENT_COLORS).map(([id, color]) => ({
  id,
  name: id.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
  description: "",
  category: "",
  color,
  githubLabel: `agent:${id}`,
}));
