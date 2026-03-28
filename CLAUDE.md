# Whitebox — Agent Context

AI agent ops dashboard. Shows what your agents are doing in real time — tasks, activity, costs, decisions.

## Product Goal
Make AI agent activity fully transparent. Anyone should be able to open Whitebox and immediately understand what every agent is working on, what was done, and how much it cost.

## Anti-goals
- No backend server — static site only, all data from GitHub APIs
- No auth — read-only public dashboard (GitHub token via env var)
- No complex state management — server components + ISR

## Tech Stack
- Next.js 14 (App Router, server components)
- Tailwind CSS v4 (CSS-based config, no tailwind.config.ts)
- octokit — GitHub REST + GraphQL API
- lucide-react — icons
- date-fns — relative timestamps
- Vercel — deploy (free tier, ISR revalidate: 300s)

## Key Files
```
app/
  layout.tsx        — root layout, dark theme
  page.tsx          — main dashboard (server component, revalidate 300s)
  globals.css       — OKLCH/hex color tokens, Tailwind v4 @theme
components/
  Sidebar.tsx       — left nav: logo, projects, agents, work
  MetricCard.tsx    — large number + label + subtitle
  ActivityFeed.tsx  — recent GitHub events with agent avatars
  TaskList.tsx      — recent issues with status dots + priority
  ThemeToggle.tsx   — dark/light switch (client)
  RefreshIndicator.tsx — auto-refresh countdown (client)
lib/
  github.ts         — all data fetching (getRecentEvents, getIssueStats, getCostReport, getDecisions, getAgentActivity, getRecentTasks)
  agents.ts         — AGENTS config (id, name, role, color, githubLabel)
  utils.ts          — relativeTime, statusColor, formatCents
  costs.ts          — CostReport type
  decisions.ts      — Decision type
```

## Environment Variables
```
GITHUB_TOKEN=      # GitHub PAT with repo + read:project scopes
GITHUB_OWNER=      # e.g. wkliwk
GITHUB_REPO=       # primary repo for costs.json + decisions.jsonl (e.g. ai-company)
PRODUCT_REPOS=     # comma-separated repos to scan for activity (e.g. money-flow-frontend,money-flow-backend)
```

## Commands
```bash
npm run dev        # local dev server (localhost:3000)
npm run build      # production build (must pass before commit)
npx tsc --noEmit   # type check (zero errors required)
```

## Data Contracts
- `costs.json` in GITHUB_REPO root — Finance agent writes weekly
- `decisions.jsonl` in GITHUB_REPO root — appended by /post-dev
- GitHub Events API — real-time activity feed
- GitHub Issues API — task list + agent status

## Board
Project 8: https://github.com/users/wkliwk/projects/8

## Decisions Log
Append decisions here or to ~/ai-company/history/decisions.jsonl
