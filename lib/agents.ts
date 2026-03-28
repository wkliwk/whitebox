export const AGENTS = [
  { id: "ceo", name: "CEO", role: "Strategy & Idea Gating", color: "oklch(0.585 0.233 277)", githubLabel: "agent:ceo" },
  { id: "pm", name: "PM", role: "Planning & PRDs", color: "oklch(0.623 0.214 259)", githubLabel: "agent:pm" },
  { id: "dev", name: "Dev", role: "Implementation", color: "oklch(0.715 0.143 215)", githubLabel: "agent:dev" },
  { id: "qa", name: "QA", role: "Code Review & Testing", color: "oklch(0.723 0.191 149)", githubLabel: "agent:qa" },
  { id: "ops", name: "Ops", role: "CI/CD & Deploys", color: "oklch(0.795 0.184 86)", githubLabel: "agent:ops" },
  { id: "designer", name: "Designer", role: "UI/UX Audits", color: "oklch(0.656 0.241 354)", githubLabel: "agent:designer" },
  { id: "finance", name: "Finance", role: "Cost Management", color: "oklch(0.585 0.233 264)", githubLabel: "agent:finance" },
] as const;

export type Agent = typeof AGENTS[number];
