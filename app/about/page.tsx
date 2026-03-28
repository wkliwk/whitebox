import { ArrowRight, GitBranch, Zap, MessageCircle, Globe } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { AGENTS } from "@/lib/agents";
import { SLASH_COMMANDS, COMMAND_CATEGORIES } from "@/lib/commands";
import { getProductRepos } from "@/lib/local";

export const revalidate = 3600;

const agentColors: Record<string, string> = {
  ceo: "#8b5cf6", pm: "#3b82f6", dev: "#06b6d4", qa: "#22c55e",
  ops: "#eab308", designer: "#ec4899", finance: "#6366f1",
};

const agentDescriptions: Record<string, string> = {
  ceo:      "Evaluates ideas, sets direction, gates new products. The only agent that can kill or approve initiatives.",
  pm:       "Turns CEO decisions into PRDs, breaks work into issues, owns the project board. Runs /daily and /status.",
  dev:      "Implements features. Works from GitHub issues, opens PRs, runs /start-working autonomously.",
  qa:       "Reviews PRs, writes tests, catches regressions before merge. Runs /dev-cycle-qa.",
  ops:      "CI/CD, deploys, infra health. Owns Vercel + Railway + Atlas. Runs /release and /sync-setup.",
  designer: "UI/UX audits, component reviews, Figma implementation. Runs /poc-build for design experiments.",
  finance:  "Cost tracking, token usage monitoring, spend optimisation reports.",
};

const phases = [
  { label: "Phase 1", title: "Ship MVP", desc: "Money Flow MVP, 5 agents, basic infra (Vercel + Railway + Atlas + GitHub Actions)", color: "#22c55e", active: true },
  { label: "Phase 2", title: "Automate Triggers", desc: "GitHub webhooks, Telegram command router, agent self-scheduling", color: "#3b82f6", active: false },
  { label: "Phase 3", title: "Self-Improve", desc: "Self-improving agents, vector memory (L3), cross-agent reasoning", color: "#8b5cf6", active: false },
];

const infra = [
  { name: "Vercel", desc: "Frontend hosting + ISR", color: "#e8e8e8", icon: Globe },
  { name: "Railway", desc: "Backend API servers", color: "#7c3aed", icon: Zap },
  { name: "MongoDB Atlas", desc: "Database (M0 free tier)", color: "#22c55e", icon: GitBranch },
  { name: "GitHub Actions", desc: "CI/CD pipelines", color: "#f97316", icon: GitBranch },
  { name: "Telegram", desc: "Director interface — Ricky's command channel", color: "#3b82f6", icon: MessageCircle },
  { name: "Claude Code", desc: "Agent runtime — all agents run as CC subprocesses", color: "#8b5cf6", icon: Zap },
];

export default function AboutPage() {
  const sidebarProjects = getProductRepos().map(r => ({
    name: r.name,
    url: `https://github.com/${r.owner}/${r.name}`,
  }));

  const commandsByCategory = COMMAND_CATEGORIES.map(cat => ({
    ...cat,
    commands: SLASH_COMMANDS.filter(c => c.category === cat.id),
  }));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#111111" }}>
      <Sidebar projects={sidebarProjects} />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 space-y-12 max-w-4xl">

          {/* Header */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#444] mb-0.5">About</div>
            <h1 className="text-xl font-bold text-[#e8e8e8] mt-1">wkliwk AI Company</h1>
            <p className="text-sm text-[#666] mt-1 leading-relaxed max-w-xl">
              A solo-founder AI company where Claude agents handle 24/7 product development.
              Ricky acts as director — sets direction via Telegram, approves key decisions.
              Agents handle everything else.
            </p>
          </div>

          {/* Vision */}
          <div className="rounded-lg border border-[#222] p-6" style={{ background: "#161616" }}>
            <div className="text-[10px] uppercase tracking-widest text-[#444] mb-3">Vision</div>
            <blockquote className="text-sm text-[#ccc] leading-relaxed border-l-2 border-[#333] pl-4 italic">
              "Build and ship real products autonomously with minimal human intervention.
              The goal is a self-sustaining company where agents write code, review it, deploy it,
              and improve it — while I set direction from my phone."
            </blockquote>
            <div className="mt-3 text-xs text-[#555]">— Ricky, founder</div>
          </div>

          {/* Agent Pipeline */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#444] mb-4">Agent Pipeline</div>
            <div className="flex items-center gap-2 flex-wrap mb-6">
              {(["ceo", "pm", "dev", "qa", "ops"] as const).map((id, i, arr) => {
                const agent = AGENTS.find(a => a.id === id);
                const color = agentColors[id];
                return (
                  <div key={id} className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{ background: color + "18", border: `1px solid ${color}33` }}>
                      <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                        style={{ background: color + "33", color }}>
                        {agent?.name[0]}
                      </div>
                      <span className="text-xs font-medium" style={{ color }}>{agent?.name}</span>
                    </div>
                    {i < arr.length - 1 && <ArrowRight size={12} className="text-[#333]" />}
                  </div>
                );
              })}
            </div>

            {/* Agent cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AGENTS.map(agent => {
                const color = agentColors[agent.id] || "#555";
                return (
                  <div key={agent.id} className="rounded-lg p-4 border border-[#1e1e1e]"
                    style={{ background: "#161616" }}>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold"
                        style={{ background: color + "22", color }}>
                        {agent.name[0]}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#e8e8e8]">{agent.name}</div>
                        <div className="text-[10px] text-[#555]">{agent.role}</div>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#777] leading-relaxed">
                      {agentDescriptions[agent.id] ?? "Specialist agent."}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Phase Plan */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#444] mb-4">Phase Plan</div>
            <div className="space-y-3">
              {phases.map(p => (
                <div key={p.label} className="flex items-start gap-4 p-4 rounded-lg border"
                  style={{ background: p.active ? p.color + "08" : "#161616", borderColor: p.active ? p.color + "33" : "#1e1e1e" }}>
                  <div className="text-[10px] font-bold px-2 py-1 rounded shrink-0 mt-0.5"
                    style={{ background: p.color + "22", color: p.color }}>
                    {p.label}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#ccc] flex items-center gap-2">
                      {p.title}
                      {p.active && <span className="text-[9px] bg-[#22c55e22] text-[#22c55e] px-1.5 py-0.5 rounded-full">Current</span>}
                    </div>
                    <div className="text-[11px] text-[#666] mt-0.5 leading-relaxed">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Infrastructure */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#444] mb-4">Infrastructure</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {infra.map(item => (
                <div key={item.name} className="p-3 rounded-lg border border-[#1e1e1e]" style={{ background: "#161616" }}>
                  <div className="text-xs font-semibold mb-0.5" style={{ color: item.color }}>{item.name}</div>
                  <div className="text-[11px] text-[#555]">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Slash Commands */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#444] mb-4">Slash Commands</div>
            <div className="space-y-6">
              {commandsByCategory.map(cat => (
                <div key={cat.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded"
                      style={{ background: cat.color + "22", color: cat.color }}>
                      {cat.label}
                    </span>
                    <span className="text-[10px] text-[#333]">{cat.commands.length} commands</span>
                  </div>
                  <div className="rounded-lg border border-[#1e1e1e] overflow-hidden">
                    {cat.commands.map((cmd, i) => (
                      <div key={cmd.name}
                        className={`flex items-start gap-4 px-4 py-2.5 ${i < cat.commands.length - 1 ? "border-b border-[#1a1a1a]" : ""}`}
                        style={{ background: "#161616" }}>
                        <code className="text-[11px] font-mono shrink-0 mt-0.5 w-40"
                          style={{ color: cat.color }}>{cmd.name}</code>
                        <span className="text-[11px] text-[#666] leading-relaxed">{cmd.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-8" />
        </div>
      </main>
    </div>
  );
}
