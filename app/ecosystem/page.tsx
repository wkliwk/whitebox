import {
  ArrowRight, ArrowDown, Terminal, Brain, Bell, Shield, Gauge,
  GitBranch, MessageCircle, Smartphone, Layers, Database, Clock,
  Workflow, Bot, Zap, Eye, AlertTriangle, RefreshCw, FolderGit2,
  Settings, FileText, Globe, Cpu, Radio,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { getProductRepos } from "@/lib/local";

export const revalidate = 3600;

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const sessionLifecycle = [
  {
    phase: "1. Prompt Submit",
    hook: "UserPromptSubmit",
    color: "#3b82f6",
    actions: [
      "Issue-first governance check — reminds agent to create GitHub issue before any work",
    ],
  },
  {
    phase: "2. Tool Use",
    hook: "PreToolUse",
    color: "#06b6d4",
    actions: [
      "session-init.sh — captures rate-limit snapshot as session baseline",
      "Stores session_start timestamp + quota % in session-start.json",
    ],
  },
  {
    phase: "3. Work Happens",
    hook: "(runtime)",
    color: "#22c55e",
    actions: [
      "Agents execute tasks, call tools, spawn sub-agents",
      "Statusline renders every few seconds (model, context%, rate limits, git branch)",
      "Usage cache refreshes every 60s via OAuth API",
    ],
  },
  {
    phase: "4. Session Ends",
    hook: "Stop",
    color: "#eab308",
    actions: [
      "Flush usage snapshot to ~/ai-company/history/token-usage.jsonl",
      "Telegram alert if quota > 70% (warn), > 90% (critical), > 95% (auto-switch to free proxy)",
      "Log session metrics to ~/Dev/token-baseline.csv",
      "Clean up sw-active marker + log to loop-log.txt",
    ],
  },
];

const memoryTypes = [
  { type: "user", color: "#8b5cf6", desc: "Who Ricky is — role, language, goals, preferences", example: "Cantonese speaker, prefers MVP-first" },
  { type: "feedback", color: "#ec4899", desc: "How to work — corrections and confirmed approaches", example: "Always create GitHub issue FIRST" },
  { type: "project", color: "#3b82f6", desc: "Ongoing work context — pointers to decisions and status", example: "Money Flow MVP frontend ~70%" },
  { type: "reference", color: "#22c55e", desc: "External resource locations and config details", example: "Quota alerts at 70/90/95% thresholds" },
];

const autonomousLoopSteps = [
  { step: "Check Quota", desc: "Read usage-cache.json — <70% normal, 70-89% skip optional, >=90% defer to free proxy", icon: Gauge },
  { step: "Scan Boards", desc: "Query all GitHub Project boards, sort by priority (P0 > P1 > P2)", icon: Layers },
  { step: "Pick Task", desc: "Highest priority Todo item. Check dependencies (blocked-by, related, parent)", icon: GitBranch },
  { step: "Execute", desc: "Read issue criteria, read CLAUDE.md, do the work, verify (tsc + tests + diff)", icon: Terminal },
  { step: "Ship", desc: "Commit, open PR, auto-merge, leave completion comment, update board to Done", icon: Zap },
  { step: "Post-Dev", desc: "Run /post-dev — check goal alignment, code quality, append to decisions.jsonl", icon: Eye },
  { step: "Loop", desc: "Immediately return to Step 2 — never stop mid-flow, never ask what to work on", icon: RefreshCw },
];

const mcpServers = [
  { name: "Telegram", desc: "Receive commands and send notifications via Telegram Bot API", color: "#3b82f6", icon: MessageCircle },
  { name: "Figma", desc: "Read designs, implement components, manage Code Connect mappings", color: "#ec4899", icon: Smartphone },
  { name: "Serena", desc: "Project-aware file system navigation and context inference", color: "#8b5cf6", icon: FolderGit2 },
  { name: "Chrome DevTools", desc: "Browser debugging via Chrome DevTools Protocol", color: "#eab308", icon: Globe },
  { name: "Playwright", desc: "Browser automation — screenshots, navigation, form filling for QA", color: "#06b6d4", icon: Eye },
  { name: "GitHub", desc: "Issues, PRs, repos, project boards, code search via GitHub API", color: "#e8e8e8", icon: GitBranch },
];

const quotaThresholds = [
  { pct: "<70%", color: "#22c55e", label: "Normal", action: "Proceed with all tasks" },
  { pct: "70-89%", color: "#eab308", label: "Warning", action: "Skip optional work, Telegram alert" },
  { pct: "90-94%", color: "#f97316", label: "Critical", action: "Telegram alert, suggest opening free proxy" },
  { pct: ">=95%", color: "#ef4444", label: "Exhausted", action: "Auto-switch to free proxy (OpenRouter/Ollama)" },
];

const commandCategories = [
  {
    label: "Work Loop", color: "#22c55e",
    commands: [
      { name: "/start-working", desc: "Autonomous task loop — picks from boards, executes, ships, repeats" },
      { name: "/assign", desc: "Delegate a specific task to a named agent" },
      { name: "/execute", desc: "Apply code changes from a plan file (anchor-based, strict)" },
    ],
  },
  {
    label: "Product Lifecycle", color: "#3b82f6",
    commands: [
      { name: "/idea", desc: "Evaluate feature or product idea — CEO + PM multi-agent review" },
      { name: "/launch-product", desc: "Set up repos, board, registry for an approved product" },
      { name: "/dev-cycle", desc: "Full dev cycle: PRD > UI Design > Tech Spec > Build > QA > Deploy" },
      { name: "/poc", desc: "Proof of concept: propose > review > build > validate" },
    ],
  },
  {
    label: "Operations", color: "#eab308",
    commands: [
      { name: "/daily", desc: "Generate daily standup across all agents, send to Telegram" },
      { name: "/status", desc: "Company-wide status report — PRs, boards, blockers" },
      { name: "/release", desc: "Tag semantic version, generate changelog, create GitHub release" },
      { name: "/post-dev", desc: "Post-task review — goal alignment, quality check, decision log" },
    ],
  },
  {
    label: "System", color: "#8b5cf6",
    commands: [
      { name: "/sync-setup", desc: "Sync live ~/.claude/ config to backup repo" },
      { name: "/switch-model", desc: "Change model (opus/sonnet/haiku/ollama/auto)" },
      { name: "/auto-route", desc: "Control dynamic model routing (on/off/lock/status)" },
      { name: "/build-mobile", desc: "Build Expo app via EAS (iOS/Android)" },
    ],
  },
];

const dataFlowLayers = [
  {
    layer: "Runtime State",
    color: "#06b6d4",
    icon: Cpu,
    items: [
      "usage-cache.json — rate limits (refreshed every 60s)",
      "session-start.json — baseline snapshot (created once per session)",
      "alert-state.json — last alert level (prevents duplicate alerts)",
      "auto-route-state.json — current model classification",
      "sw-active — marker file for autonomous work loop",
    ],
  },
  {
    layer: "Session Logs",
    color: "#22c55e",
    icon: FileText,
    items: [
      "token-usage.jsonl — rate limits + timestamps per session",
      "token-baseline.csv — repo, tokens, duration per session",
      "loop-log.txt — one line per completed task",
      "session-log.log — session metrics",
    ],
  },
  {
    layer: "Persistent Knowledge",
    color: "#8b5cf6",
    icon: Brain,
    items: [
      "MEMORY.md + 24 memory files — loaded every conversation",
      "decisions.jsonl — append-only task decision log",
      "ADR-*.md — architecture decision records",
      "PRD-*.md, TECH-SPEC-*.md — product specifications",
    ],
  },
  {
    layer: "Shared Config",
    color: "#eab308",
    icon: Settings,
    items: [
      "product-registry.md — all products, repos, boards, CWD match",
      "CLAUDE.md — per-repo context (goal, stack, commands, anti-goals)",
      "settings.json — hooks, plugins, statusline",
      "mcp.json — MCP server definitions",
    ],
  },
];

const agentRoles = [
  { id: "ceo", name: "CEO", color: "#8b5cf6", desc: "Strategic decisions, idea evaluation, PoC approval/rejection" },
  { id: "pm", name: "PM", color: "#3b82f6", desc: "PRDs, task breakdown, project board management, daily/status reports" },
  { id: "frontend", name: "Frontend Dev", color: "#06b6d4", desc: "React/TypeScript/MUI features, Vercel deployment" },
  { id: "backend", name: "Backend Dev", color: "#06b6d4", desc: "Express/TypeScript APIs, Mongoose models, Railway deployment" },
  { id: "mobile", name: "Mobile Dev", color: "#06b6d4", desc: "Expo/React Native features, EAS builds, app store submission" },
  { id: "qa", name: "QA", color: "#22c55e", desc: "PR reviews, security checks (OWASP), test writing, acceptance validation" },
  { id: "ops", name: "Ops", color: "#eab308", desc: "CI/CD, deploys, infra health, releases, monitoring" },
  { id: "designer", name: "Designer", color: "#ec4899", desc: "UI/UX audits, Figma implementation, Playwright screenshot QA" },
  { id: "finance", name: "Finance", color: "#6366f1", desc: "Token cost tracking, spend reports, budget optimization" },
  { id: "ai-researcher", name: "AI Researcher", color: "#f97316", desc: "Weekly AI news scan, tool evaluation, adoption recommendations" },
  { id: "cc-manager", name: "CC Manager", color: "#e8e8e8", desc: "Agent prompts, memory maintenance, system optimization" },
];

const cronJobs = [
  { schedule: "*/30 * * * *", desc: "Token quota alert check — reads usage-cache, sends Telegram if threshold crossed", color: "#eab308" },
  { schedule: "0 * * * *", desc: "Watchdog safety check — backup alert if quota detection was missed", color: "#f97316" },
  { schedule: "3 13 * * 1", desc: "Weekly AI research pipeline — scan news, evaluate, write brief, create issues", color: "#8b5cf6" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function EcosystemPage() {
  const sidebarProjects = getProductRepos().map(r => ({
    name: r.name,
    url: `https://github.com/${r.owner}/${r.name}`,
  }));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#111111" }}>
      <Sidebar projects={sidebarProjects} />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 space-y-14 max-w-5xl">

          {/* Header */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888] mb-0.5">Ecosystem</div>
            <h1 className="text-xl font-bold text-[#e8e8e8] mt-1">How The System Works</h1>
            <p className="text-sm text-[#888] mt-1 leading-relaxed max-w-2xl">
              A complete map of how Claude Code agents, hooks, MCP servers, monitoring, and automation
              work together to run an autonomous AI company. Every mechanism, trigger, and data flow documented.
            </p>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Big Picture */}
          {/* ============================================================ */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888] mb-4">Big Picture</div>
            <div className="rounded-lg border border-[#222] p-6" style={{ background: "#161616" }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-xs font-semibold text-[#3b82f6] mb-2 flex items-center gap-1.5">
                    <MessageCircle size={12} /> Director Layer
                  </div>
                  <p className="text-[11px] text-[#888] leading-relaxed">
                    Ricky sets direction via Telegram or terminal. Ideas go through CEO+PM evaluation.
                    Approved work lands on GitHub Project boards as prioritized issues.
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#22c55e] mb-2 flex items-center gap-1.5">
                    <Bot size={12} /> Agent Layer
                  </div>
                  <p className="text-[11px] text-[#888] leading-relaxed">
                    11 specialized agents (CEO, PM, 3 Devs, QA, Ops, Designer, Finance, AI Researcher, CC Manager)
                    pick tasks from boards, execute autonomously, ship PRs, and loop to the next task.
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#eab308] mb-2 flex items-center gap-1.5">
                    <Settings size={12} /> Infrastructure Layer
                  </div>
                  <p className="text-[11px] text-[#888] leading-relaxed">
                    Hooks enforce governance (issue-first rule). Cron jobs monitor quota and trigger alerts.
                    MCP servers connect Telegram, Figma, GitHub, and browser automation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Session Lifecycle */}
          {/* ============================================================ */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888] mb-4">Session Lifecycle</div>
            <p className="text-[11px] text-[#777] mb-4 max-w-2xl">
              Every Claude Code session follows this lifecycle. Hooks fire at each phase, collecting data
              and enforcing rules automatically.
            </p>
            <div className="space-y-3">
              {sessionLifecycle.map((phase, i) => (
                <div key={phase.phase}>
                  <div className="flex items-start gap-4 p-4 rounded-lg border border-[#2a2a2a]"
                    style={{ background: "#161616" }}>
                    <div className="shrink-0">
                      <div className="text-[10px] font-bold px-2 py-1 rounded"
                        style={{ background: phase.color + "22", color: phase.color }}>
                        {phase.phase}
                      </div>
                      <div className="text-[9px] text-[#666] mt-1 text-center font-mono">{phase.hook}</div>
                    </div>
                    <div className="flex-1">
                      <ul className="space-y-1">
                        {phase.actions.map((action, j) => (
                          <li key={j} className="text-[11px] text-[#999] leading-relaxed flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: phase.color }} />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {i < sessionLifecycle.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown size={12} className="text-[#444]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Autonomous Work Loop */}
          {/* ============================================================ */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888] mb-4">Autonomous Work Loop (/start-working)</div>
            <p className="text-[11px] text-[#777] mb-4 max-w-2xl">
              The core engine. When triggered, the agent self-directs from project boards without human input.
              It picks the highest-priority task, executes it fully, ships it, and loops. Circuit breaker stops
              after 3 consecutive failures.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {autonomousLoopSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.step}
                    className="flex items-start gap-3 p-3.5 rounded-lg border border-[#2a2a2a]"
                    style={{ background: "#161616" }}>
                    <div className="w-7 h-7 rounded flex items-center justify-center shrink-0"
                      style={{ background: "#22c55e18" }}>
                      <Icon size={13} className="text-[#22c55e]" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#e8e8e8] flex items-center gap-2">
                        <span className="text-[9px] text-[#666] font-mono">#{i + 1}</span>
                        {step.step}
                      </div>
                      <div className="text-[11px] text-[#777] mt-0.5 leading-relaxed">{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 p-3 rounded-lg border border-[#ef444433]" style={{ background: "#ef444408" }}>
              <div className="flex items-center gap-2 text-[11px] text-[#ef4444]">
                <AlertTriangle size={12} />
                <span className="font-semibold">Circuit Breaker:</span>
                <span className="text-[#999]">3 consecutive blocked/failed tasks = full stop + Telegram alert to Ricky</span>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Agent Roster */}
          {/* ============================================================ */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888] mb-4">Agent Roster (11 Agents)</div>
            <p className="text-[11px] text-[#777] mb-4 max-w-2xl">
              Each agent is a Claude Code subprocess with a specialized system prompt. Tasks are routed
              to agents by type. Agents can spawn background workers in isolated git worktrees.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {agentRoles.map(agent => (
                <div key={agent.id} className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-[#2a2a2a]"
                  style={{ background: "#161616" }}>
                  <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ background: agent.color + "22", color: agent.color }}>
                    {agent.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[#e8e8e8]">{agent.name}</div>
                    <div className="text-[10px] text-[#777] leading-relaxed truncate">{agent.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: MCP Servers */}
          {/* ============================================================ */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888] mb-4">MCP Servers</div>
            <p className="text-[11px] text-[#777] mb-4 max-w-2xl">
              Model Context Protocol servers extend Claude Code with external tool access.
              They launch on session start and stay active throughout.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {mcpServers.map(server => {
                const Icon = server.icon;
                return (
                  <div key={server.name} className="p-3 rounded-lg border border-[#2a2a2a]"
                    style={{ background: "#161616" }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon size={12} style={{ color: server.color }} />
                      <div className="text-xs font-semibold" style={{ color: server.color }}>{server.name}</div>
                    </div>
                    <div className="text-[10px] text-[#777] leading-relaxed">{server.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Memory System */}
          {/* ============================================================ */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888] mb-4">Memory System</div>
            <p className="text-[11px] text-[#777] mb-4 max-w-2xl">
              Persistent, file-based memory loaded into every conversation via MEMORY.md index.
              Memory stores lean pointers — large decisions go to ADRs, task context to decisions.jsonl.
            </p>
            <div className="space-y-2.5">
              {memoryTypes.map(mem => (
                <div key={mem.type} className="flex items-start gap-4 p-3.5 rounded-lg border border-[#2a2a2a]"
                  style={{ background: "#161616" }}>
                  <div className="text-[10px] font-bold px-2 py-1 rounded shrink-0"
                    style={{ background: mem.color + "22", color: mem.color }}>
                    {mem.type}
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] text-[#999] leading-relaxed">{mem.desc}</div>
                    <div className="text-[10px] text-[#666] mt-1 font-mono">e.g. "{mem.example}"</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-[#222] p-4" style={{ background: "#161616" }}>
              <div className="text-[10px] uppercase tracking-widest text-[#888] mb-2">Memory Loading Flow</div>
              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                <span className="px-2 py-1 rounded bg-[#8b5cf622] text-[#8b5cf6] font-mono text-[10px]">Session Start</span>
                <ArrowRight size={10} className="text-[#444]" />
                <span className="px-2 py-1 rounded bg-[#8b5cf622] text-[#8b5cf6] font-mono text-[10px]">Load MEMORY.md</span>
                <ArrowRight size={10} className="text-[#444]" />
                <span className="px-2 py-1 rounded bg-[#8b5cf622] text-[#8b5cf6] font-mono text-[10px]">24 Memory Files</span>
                <ArrowRight size={10} className="text-[#444]" />
                <span className="px-2 py-1 rounded bg-[#8b5cf622] text-[#8b5cf6] font-mono text-[10px]">Context Injected</span>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Token Quota Monitoring */}
          {/* ============================================================ */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888] mb-4">Token Quota Monitoring</div>
            <p className="text-[11px] text-[#777] mb-4 max-w-2xl">
              Real-time quota tracking with graduated alerts via Telegram and automatic fallback
              to free models when quota is exhausted. Two windows monitored: 5-hour and 7-day.
            </p>
            <div className="rounded-lg border border-[#222] overflow-hidden">
              <div className="grid grid-cols-4 text-[10px] font-semibold text-[#888] px-4 py-2 border-b border-[#222]"
                style={{ background: "#1a1a1a" }}>
                <span>Usage</span>
                <span>Level</span>
                <span className="col-span-2">Action</span>
              </div>
              {quotaThresholds.map(t => (
                <div key={t.pct} className="grid grid-cols-4 items-center px-4 py-2.5 border-b border-[#1e1e1e] last:border-0"
                  style={{ background: "#161616" }}>
                  <span className="text-xs font-mono font-bold" style={{ color: t.color }}>{t.pct}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded w-fit"
                    style={{ background: t.color + "18", color: t.color }}>
                    {t.label}
                  </span>
                  <span className="text-[11px] text-[#888] col-span-2">{t.action}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-[#2a2a2a]" style={{ background: "#161616" }}>
                <div className="text-[10px] text-[#888] mb-1">Data Source</div>
                <div className="text-xs text-[#ccc]">OAuth API</div>
                <div className="text-[10px] text-[#666]">api.anthropic.com/api/oauth/usage</div>
              </div>
              <div className="p-3 rounded-lg border border-[#2a2a2a]" style={{ background: "#161616" }}>
                <div className="text-[10px] text-[#888] mb-1">Refresh Rate</div>
                <div className="text-xs text-[#ccc]">Every 60 seconds</div>
                <div className="text-[10px] text-[#666]">Cached in usage-cache.json</div>
              </div>
              <div className="p-3 rounded-lg border border-[#2a2a2a]" style={{ background: "#161616" }}>
                <div className="text-[10px] text-[#888] mb-1">Alert Hysteresis</div>
                <div className="text-xs text-[#ccc]">Resets below 60%</div>
                <div className="text-[10px] text-[#666]">Prevents duplicate Telegram messages</div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Data Flow Layers */}
          {/* ============================================================ */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888] mb-4">Data Flow Layers</div>
            <div className="space-y-3">
              {dataFlowLayers.map(layer => {
                const Icon = layer.icon;
                return (
                  <div key={layer.layer} className="rounded-lg border border-[#2a2a2a] p-4"
                    style={{ background: "#161616" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon size={13} style={{ color: layer.color }} />
                      <div className="text-xs font-semibold" style={{ color: layer.color }}>{layer.layer}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      {layer.items.map((item, i) => (
                        <div key={i} className="text-[11px] text-[#888] flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: layer.color }} />
                          <span className="font-mono">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Slash Commands */}
          {/* ============================================================ */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888] mb-4">Slash Commands (31 Total)</div>
            <p className="text-[11px] text-[#777] mb-4 max-w-2xl">
              Custom commands that orchestrate multi-agent workflows. Each is a markdown file
              in ~/.claude/commands/ loaded at session start.
            </p>
            <div className="space-y-5">
              {commandCategories.map(cat => (
                <div key={cat.label}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded"
                      style={{ background: cat.color + "22", color: cat.color }}>
                      {cat.label}
                    </span>
                  </div>
                  <div className="rounded-lg border border-[#2a2a2a] overflow-hidden">
                    {cat.commands.map((cmd, i) => (
                      <div key={cmd.name}
                        className={`flex items-start gap-4 px-4 py-2.5 ${i < cat.commands.length - 1 ? "border-b border-[#222]" : ""}`}
                        style={{ background: "#161616" }}>
                        <code className="text-[11px] font-mono shrink-0 mt-0.5 w-36"
                          style={{ color: cat.color }}>{cmd.name}</code>
                        <span className="text-[11px] text-[#888] leading-relaxed">{cmd.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Scheduled Automation */}
          {/* ============================================================ */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888] mb-4">Scheduled Automation</div>
            <p className="text-[11px] text-[#777] mb-4 max-w-2xl">
              Cron jobs and scheduled triggers that run without human intervention.
            </p>
            <div className="space-y-2.5">
              {cronJobs.map(job => (
                <div key={job.schedule} className="flex items-center gap-4 p-3.5 rounded-lg border border-[#2a2a2a]"
                  style={{ background: "#161616" }}>
                  <code className="text-[10px] font-mono px-2 py-1 rounded shrink-0"
                    style={{ background: job.color + "18", color: job.color }}>
                    {job.schedule}
                  </code>
                  <span className="text-[11px] text-[#888]">{job.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Statusline */}
          {/* ============================================================ */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888] mb-4">Statusline</div>
            <p className="text-[11px] text-[#777] mb-4 max-w-2xl">
              Custom terminal status bar rendered continuously during sessions. Shows real-time system state.
            </p>
            <div className="rounded-lg border border-[#222] p-4 font-mono text-[11px]" style={{ background: "#0d0d0d" }}>
              <div className="text-[#888]">
                <span className="text-[#8b5cf6]">Opus 4.6</span>
                <span className="text-[#444]"> | </span>
                <span className="text-[#22c55e]">ctx 34%</span>
                <span className="text-[#444]"> | </span>
                <span className="text-[#888]">1h 23m</span>
                <span className="text-[#444]"> | </span>
                <span className="text-[#eab308]">$2.14</span>
              </div>
              <div className="text-[#666] mt-0.5">
                <span className="text-[#888]">whitebox</span>
                <span className="text-[#444]"> | </span>
                <span className="text-[#22c55e]">main</span>
                <span className="text-[#ef4444]">*</span>
                <span className="text-[#444]"> | </span>
                <span className="text-[#06b6d4]">ecosystem page</span>
              </div>
              <div className="text-[#666] mt-1 border-t border-[#222] pt-1">
                <span className="text-[#eab308]">5h</span>
                <span className="text-[#444]"> 67% </span>
                <span className="text-[#22c55e]">||||||||</span><span className="text-[#333]">||||</span>
                <span className="text-[#444]"> resets 2h 15m</span>
                <span className="text-[#444]"> | </span>
                <span className="text-[#3b82f6]">7d</span>
                <span className="text-[#444]"> 45% </span>
                <span className="text-[#22c55e]">|||||</span><span className="text-[#333]">||||||</span>
                <span className="text-[#444]"> resets 4d</span>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: "Line 1", desc: "Model, context %, duration, cost" },
                { label: "Line 2", desc: "Directory, git branch (dirty*), task label" },
                { label: "Rate Limits", desc: "5h + 7d usage bars with reset countdown" },
                { label: "Data Source", desc: "OAuth API (60s cache) + macOS Keychain" },
              ].map(item => (
                <div key={item.label} className="p-2 rounded border border-[#222]" style={{ background: "#161616" }}>
                  <div className="text-[10px] text-[#888] font-semibold">{item.label}</div>
                  <div className="text-[10px] text-[#666]">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Governance Rules */}
          {/* ============================================================ */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888] mb-4">Governance Rules</div>
            <p className="text-[11px] text-[#777] mb-4 max-w-2xl">
              Hard rules enforced across all agents and sessions. Violations trigger warnings or blocks.
            </p>
            <div className="space-y-2">
              {[
                { rule: "Issue First", desc: "Create GitHub issue and add to project board BEFORE any work. Enforced by UserPromptSubmit hook.", icon: Shield, color: "#ef4444" },
                { rule: "Verify Before Commit", desc: "Run tsc --noEmit, tests, and git diff before every commit. No exceptions.", icon: Shield, color: "#f97316" },
                { rule: "Never Stop Mid-Flow", desc: "After completing a task, immediately loop to the next one. Only stop on circuit breaker or rate limit.", icon: RefreshCw, color: "#eab308" },
                { rule: "Check Issue State", desc: "Background workers must verify issue is still OPEN before starting. Skip if CLOSED.", icon: Eye, color: "#3b82f6" },
                { rule: "Auto-Merge at MVP", desc: "During MVP stage, auto-merge PRs and deploy immediately. Don't wait for review.", icon: Zap, color: "#22c55e" },
                { rule: "Memory = Pointers", desc: "Memory files are lean index entries. Decisions go to ADRs, task context to decisions.jsonl.", icon: Brain, color: "#8b5cf6" },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.rule} className="flex items-start gap-3 px-4 py-3 rounded-lg border border-[#2a2a2a]"
                    style={{ background: "#161616" }}>
                    <Icon size={13} className="mt-0.5 shrink-0" style={{ color: item.color }} />
                    <div>
                      <div className="text-xs font-semibold" style={{ color: item.color }}>{item.rule}</div>
                      <div className="text-[11px] text-[#777] mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Config Sync */}
          {/* ============================================================ */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888] mb-4">Config Sync & Backup</div>
            <div className="rounded-lg border border-[#222] p-5" style={{ background: "#161616" }}>
              <div className="flex items-center gap-3 mb-4">
                <FolderGit2 size={14} className="text-[#06b6d4]" />
                <div>
                  <div className="text-xs font-semibold text-[#e8e8e8]">wkliwk/claude-code-setup</div>
                  <div className="text-[10px] text-[#777]">Private backup repo — synced via /sync-setup</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <div className="text-[10px] text-[#22c55e] font-semibold mb-1.5">Synced</div>
                  <ul className="space-y-1 text-[#888]">
                    <li>commands/ (31 slash commands)</li>
                    <li>skills/ (user-facing skill docs)</li>
                    <li>settings.json.example (secrets stripped)</li>
                    <li>mcp.json.example (tokens replaced)</li>
                    <li>usage-monitor/ (scripts)</li>
                    <li>agents/ (agent prompts)</li>
                    <li>company/ (handbook, ADRs, docs)</li>
                  </ul>
                </div>
                <div>
                  <div className="text-[10px] text-[#ef4444] font-semibold mb-1.5">Never Synced</div>
                  <ul className="space-y-1 text-[#888]">
                    <li>.env files (bot tokens, API keys)</li>
                    <li>.credentials.json (OAuth)</li>
                    <li>Memory content (personal context)</li>
                    <li>Session logs (too large)</li>
                    <li>.claude/projects/ (per-project state)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Product Registry */}
          {/* ============================================================ */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888] mb-4">Product Registry</div>
            <p className="text-[11px] text-[#777] mb-4 max-w-2xl">
              Central registry file (shared/product-registry.md) that all slash commands reference
              for product detection, repo mapping, and board routing. Updated whenever a new product launches.
            </p>
            <div className="rounded-lg border border-[#222] overflow-hidden">
              <div className="grid grid-cols-5 text-[10px] font-semibold text-[#888] px-4 py-2 border-b border-[#222]"
                style={{ background: "#1a1a1a" }}>
                <span>Product</span>
                <span>Board</span>
                <span>Platform</span>
                <span className="col-span-2">Detection</span>
              </div>
              {[
                { name: "Money Flow", board: "P1", platform: "Web + Mobile", detect: "CWD contains 'money-flow'" },
                { name: "Company Ops", board: "P2", platform: "Internal", detect: "Infra/agent tasks" },
                { name: "Ideas", board: "P3", platform: "Pipeline", detect: "New product proposals" },
                { name: "FormPilot", board: "P6", platform: "Web (Chrome ext)", detect: "CWD contains 'formPilot'" },
                { name: "Health Credit", board: "P7", platform: "Web", detect: "CWD contains 'health'" },
                { name: "Whitebox", board: "P8", platform: "Web", detect: "CWD contains 'whitebox'" },
              ].map(p => (
                <div key={p.name} className="grid grid-cols-5 items-center px-4 py-2 border-b border-[#1e1e1e] last:border-0 text-[11px]"
                  style={{ background: "#161616" }}>
                  <span className="text-[#e8e8e8] font-medium">{p.name}</span>
                  <span className="text-[#888] font-mono">{p.board}</span>
                  <span className="text-[#888]">{p.platform}</span>
                  <span className="text-[#666] col-span-2 font-mono text-[10px]">{p.detect}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION: Use Cases */}
          {/* ============================================================ */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#888] mb-4">Use Cases</div>
            <div className="space-y-3">
              {[
                {
                  title: "Ricky has an idea on the train",
                  flow: "Telegram message > /idea evaluates (CEO+PM) > approved > GitHub issue created on product board > next /start-working picks it up > agent builds, tests, ships PR > auto-merged > deployed to Vercel/Railway > Ricky gets Telegram notification",
                  color: "#3b82f6",
                },
                {
                  title: "Overnight autonomous development",
                  flow: "/start-working launched in tmux > agent scans boards > picks P0 task > reads issue + CLAUDE.md > implements > tsc + tests pass > commits + PR > auto-merge > /post-dev review > loops to next task > quota hits 95% > auto-switches to free proxy > continues on lower-priority tasks",
                  color: "#22c55e",
                },
                {
                  title: "Weekly AI research pipeline",
                  flow: "Monday 1pm UTC cron fires > AI Researcher scans news > writes brief to whitebox/research/ > creates 'Adopt' issues on Ideas board > CC Manager evaluates adoptable items > creates integration issues on Company Ops board > Telegram summary sent to Ricky",
                  color: "#8b5cf6",
                },
                {
                  title: "New product launch",
                  flow: "/idea evaluates concept > CEO approves > draft added to Ideas board (P3) > /launch-product creates repos + project board + CLAUDE.md > updates product-registry.md > seeds initial issues > agents can now /start-working on the new product",
                  color: "#eab308",
                },
                {
                  title: "Quota emergency at 3am",
                  flow: "Cron checks usage-cache.json > 95% threshold crossed > Telegram EXHAUSTED alert sent > alert.sh auto-switches to free proxy (OpenRouter qwen3-coder) > agent continues on lower-priority tasks > next morning Ricky sees alert history > /switch-model opus when quota resets",
                  color: "#ef4444",
                },
              ].map(uc => (
                <div key={uc.title} className="rounded-lg border border-[#2a2a2a] p-4" style={{ background: "#161616" }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: uc.color }}>{uc.title}</div>
                  <div className="text-[11px] text-[#888] leading-relaxed">{uc.flow}</div>
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
