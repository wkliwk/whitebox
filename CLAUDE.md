# Whitebox — Agent Ops Dashboard

Real-time visibility into what your Claude Code agents are doing. Every session, task, cost, decision, and live process — visible from anywhere via production Vercel deploy.

## Product Goal
Make AI agent activity fully transparent. Open Whitebox and immediately know what every agent is working on, what was built, what it cost, and what's running right now on your local machine.

## Anti-goals
- No auth — read-only dashboard (GitHub token via env var only)
- No complex state management — server components + ISR everywhere
- No over-engineering — data is read from files/APIs, not a custom backend

---

## Tech Stack
- **Next.js 15.5.14** — App Router, server components, ISR
- **Tailwind CSS v4** — CSS-based config (`app/layout.css`), no `tailwind.config.ts`
- **@upstash/redis** — agent heartbeats + loop event streaming
- **octokit** — GitHub REST API (issues, events, project boards)
- **lucide-react** — icons
- Node.js 24.x on Vercel

---

## Pages

| Route | Title | Data Source | Revalidate |
|---|---|---|---|
| `/` | Dashboard | local files + GitHub API | 30s |
| `/issues` | Issues | GitHub API (all product repos) | 30s |
| `/logs` | Logs | GitHub API + Redis (loop events) | dynamic |
| `/board` | Board | GitHub Projects GraphQL API | 30s |
| `/products` | Products | `shared/product-registry.md` + GitHub | 60s |
| `/products/[id]` | Product detail | GitHub project board + issues | 30s |
| `/teams` | Teams | `~/.claude/agents/*.md` (local) | 5s |
| `/tools` | Tools | `~/.claude/settings.json` + MCP config (local) | dynamic |
| `/schedule` | Schedule | `crontab` + launchd plist (local) | dynamic |
| `/about` | About | static | 1h |

---

## Features

### Dashboard (`/`)
- **Live Sessions panel** — detects running Claude Code processes via `ps aux`, merges with Redis heartbeats to show agent type + task + project + duration
- **Metric cards** — Active Projects (active in last 24h), Decisions Today, Open Tasks (in-progress count)
- **Token quota card** — reads `~/.claude/usage-monitor/usage-cache.json`, shows 5-hour and 7-day usage %
- **Recent Decisions feed** — last 5 entries from `decisions.jsonl`
- **Auto-refresh** — client-side RefreshIndicator shows countdown to next ISR revalidation

### Issues (`/issues`)
- All open/in-progress/done issues across all tracked product repos
- **Repo filter pills** — one pill per repo, `?repo=` query param, server-side navigation
- Stats cards: Todo / In Progress / Done counts (reflect active filter)
- Priority icons, status dots, labels, relative timestamps

### Logs (`/logs`)
- **Recent Activity** — last 20 decisions from `decisions.jsonl` as activity feed
- **Loop Log** — colour-coded timeline of loop events:
  - Local dev: reads `~/Dev/whitebox/history/loop-log.txt` directly
  - Production: reads from Upstash Redis (`whitebox:loop-events`) via `/api/loop-events`
  - Levels: blue=info, yellow=warn (BLOCKED/SKIPPED/rate-limit), red=error, gray=debug
  - Error count badge in header when errors present
- **Decision Log** — full `decisions.jsonl` history

### Board (`/board`)
- Kanban view of all GitHub Project boards (Money Flow, Company Ops, Ideas, FormPilot, Health Credit, Whitebox, etc.)
- Groups items by status column, colour-coded per board
- Links to GitHub issues + board

### Products (`/products`)
- Cards for each active product with: status badge, open issue count badge, tagline, goal, anti-goals, repo links, board link, production URL, localhost dev link
- Ideas Pipeline section — items from GitHub Project 3 (Ideas board) grouped by stage
- Open issue count fetched server-side via `getOpenIssueCountsForRepos()`

### Product Detail (`/products/[id]`)
- Live board items for the product's GitHub Project board
- Open issues list with status + priority

### Teams (`/teams`)
- Org chart of all agents — reads `~/.claude/agents/*.md` dynamically
- Agent cards with role, description, skills (from `~/.claude/commands/`)
- Click agent → drawer with full role description + skill list
- Live status dots from Redis heartbeats

### Tools (`/tools`)
- MCP servers installed in Claude Code (reads `~/.claude/settings.json` + MCP config)
- Installed plugins
- Tool inventory per MCP server

### Schedule (`/schedule`)
- All cron jobs from `crontab -l`
- launchd plists from `~/Library/LaunchAgents/`
- Loop log history summary

---

## API Routes

| Route | Purpose | Auth |
|---|---|---|
| `GET /api/sessions` | Live Claude Code processes + Redis heartbeats merged | none |
| `POST /api/heartbeat` | Agent writes heartbeat to Redis (TTL 3min) | `HEARTBEAT_SECRET` bearer |
| `GET /api/loop-events` | Last 30 loop events from Redis | none |
| `GET /api/agents` | Agent definitions from `~/.claude/agents/*.md` | none |
| `GET /api/agent/[id]` | Single agent definition + skills | none |
| `GET /api/mcp` | MCP server inventory from local config | none |
| `GET /api/quota` | Token quota from `~/.claude/usage-monitor/usage-cache.json` | none |
| `GET /api/schedule` | Cron jobs + launchd plists | none |

---

## Data Sources

### Local filesystem (dev only — reads from `~/`)
| File | Used by |
|---|---|
| `~/Dev/whitebox/history/loop-log.txt` | Loop Log (dev), `/api/schedule` |
| `~/Dev/decisions.jsonl` | Decision Log, Recent Decisions, Activity feed |
| `~/.claude/agents/*.md` | Teams page, `/api/agents` |
| `~/.claude/settings.json` | Tools page (MCP + plugins), quota |
| `~/.claude/usage-monitor/usage-cache.json` | Quota card |
| `~/Dev/*/shared/product-registry.md` | Products page (auto-discovered) |
| `ps aux` output | Live Sessions (process detection) |
| `crontab -l` + launchd plists | Schedule page |

### Redis (Upstash — works in both dev and production)
| Key | Used by |
|---|---|
| `agent:heartbeat:<type>` | Live Sessions (merged with ps aux), agent status dots |
| `whitebox:loop-events` | Loop Log on production (`/api/loop-events`) |

### GitHub API
| Data | Used by |
|---|---|
| Issues across product repos | Issues page, metric cards |
| GitHub Events | Activity feed (fallback) |
| Project board items (GraphQL) | Board page, Product detail page |
| `decisions.jsonl` file content | Decision Log (fallback when local file missing) |
| Open issue counts per repo | Products page badges |

---

## Redis Loop Event Bridge

Production Whitebox can't read local files. Events are streamed via Redis:

```
Local machine                     Redis                    Production Whitebox
────────────────                  ──────────────────────   ─────────────────────
settings.json PreToolUse hook  →  whitebox:loop-events  ←  /api/loop-events
settings.json Stop hook        →  (LPUSH, capped 100)       → LoopLog component
~/.claude/log-loop-event.sh    →
(task completions in loop)
```

**Scripts:**
- `~/.claude/push-loop-event.sh '<json>'` — pushes one event to Redis
- `~/.claude/log-loop-event.sh 'message' [level]` — writes to local log file AND Redis

**Event format:**
```json
{ "timestamp": "2026-03-30 13:45:00", "agent": "loop", "action": "completed #99 ...", "level": "info" }
```

---

## Agent Heartbeat System

Agents POST to `/api/heartbeat` to show as "live" in the dashboard.

```bash
bash ~/Dev/whitebox/scripts/heartbeat.sh started frontend-dev "Building login page" money-flow-frontend
bash ~/Dev/whitebox/scripts/heartbeat.sh completed frontend-dev "" money-flow-frontend
```

Heartbeats expire automatically after 3 minutes (Redis TTL). The `/api/sessions` route merges live `ps aux` processes with Redis heartbeats — heartbeats win on agent-type info.

---

## Key Files

```
app/
  page.tsx                  — Dashboard (Live Sessions + metrics + decisions)
  issues/page.tsx           — Issues with repo filter
  logs/page.tsx             — Activity + Loop Log + Decision Log
  board/page.tsx            — Multi-board kanban
  products/page.tsx         — Product cards + Ideas pipeline
  products/[id]/page.tsx    — Product detail (board + issues)
  teams/page.tsx            — Agent org chart
  tools/page.tsx            — MCP server inventory
  schedule/page.tsx         — Cron jobs + launchd
  about/page.tsx            — System architecture diagram
  api/sessions/route.ts     — Live process + heartbeat merge
  api/heartbeat/route.ts    — Agent heartbeat write/read
  api/loop-events/route.ts  — Redis loop event stream
  api/agents/route.ts       — Dynamic agent list from ~/.claude/agents/
  api/mcp/route.ts          — MCP server inventory
  api/quota/route.ts        — Token quota reader
  api/schedule/route.ts     — Cron + launchd reader

components/
  Sidebar.tsx               — Left nav: logo, pages, agent list, product list
  LiveSessions.tsx          — Live Claude Code process cards
  MetricCard.tsx            — Large number + label + subtitle
  QuotaCard.tsx             — Token usage % bars
  ActivityFeed.tsx          — Timestamped agent action rows
  TaskList.tsx              — Issue rows with status dots + priority
  LoopLog.tsx               — Colour-coded loop event timeline
  DecisionLog.tsx           — decisions.jsonl entries
  OrgChart.tsx              — Agent cards with drawer
  AgentDrawer.tsx           — Slide-in agent detail panel
  ToolsPanel.tsx            — MCP server + plugin inventory
  SchedulePanel.tsx         — Cron job list

lib/
  local.ts                  — Reads local files: decisions, loop log, sessions, product registry
  github.ts                 — GitHub API: issues, events, tasks, open issue counts
  redis.ts                  — Upstash: heartbeat read/write, loop event read
  products.ts               — ProductDef type + PRODUCTS array (from registry)
  projects.ts               — GitHub Projects GraphQL (board items)
  agents.ts                 — AGENT_COLORS + AgentDef type
  costs.ts                  — CostReport type
  cache.ts                  — In-memory TTL cache for API routes
  i18n.ts                   — Language toggle (廣東話/EN)
  utils.ts                  — relativeTime, statusColor, formatCents
```

---

## Environment Variables

```bash
# GitHub
GITHUB_TOKEN=          # PAT with repo + read:project scopes
GITHUB_OWNER=          # e.g. wkliwk
GITHUB_REPO=           # repo containing decisions.jsonl (e.g. whitebox)
PRODUCT_REPOS=         # comma-separated repos to scan for issues + activity
                       # e.g. money-flow-frontend,money-flow-backend,FormPilot,whitebox

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=    # https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=  # upstash token

# Optional
HEARTBEAT_SECRET=      # shared secret for POST /api/heartbeat (omit to allow all)
```

---

## Commands

```bash
npm run dev          # local dev server (localhost:3000)
npm run build        # production build — must pass before every commit
npx tsc --noEmit     # type check — zero errors required
```

---

## Board
Project 8: https://github.com/users/wkliwk/projects/8

## Production URL
https://whitebox-khaki.vercel.app
