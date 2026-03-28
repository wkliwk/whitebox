export interface SlashCommand {
  name: string;
  description: string;
  category: "workflow" | "product" | "dev" | "ops" | "meta";
}

export const SLASH_COMMANDS: SlashCommand[] = [
  // Workflow
  { name: "/start-working", description: "Autonomous work loop — checks boards, picks top Todo, works until done, loops", category: "workflow" },
  { name: "/post-dev", description: "Post-dev review: goal alignment, CI check, decisions log update", category: "workflow" },
  { name: "/daily", description: "Daily standup report across all agents — sent to Telegram", category: "workflow" },
  { name: "/status", description: "Full AI company status: products, PRs, tasks — sent to Telegram", category: "workflow" },
  { name: "/dev-cycle", description: "Full dev cycle guide: PRD → build → QA → deploy", category: "workflow" },

  // Product
  { name: "/idea", description: "Evaluate any idea — feature or new product. Routes to CEO or PM automatically", category: "product" },
  { name: "/new-product", description: "Redirect to /idea — merged in, use /idea instead", category: "product" },
  { name: "/launch-product", description: "Set up repos, project board, registry entry, and seed issues for an approved product", category: "product" },
  { name: "/issue", description: "Report a bug — QA verifies, logs as GitHub issue if confirmed", category: "product" },
  { name: "/add-task", description: "Add one or more tasks to the correct GitHub Project board with all fields set", category: "product" },
  { name: "/assign", description: "Assign a task to a specific agent", category: "product" },
  { name: "/poc", description: "Proof of Concept workflow: PROPOSE → REVIEW → BUILD", category: "product" },

  // Dev
  { name: "/dev-cycle-build", description: "Build phase of the dev cycle", category: "dev" },
  { name: "/dev-cycle-prd", description: "PRD phase — PM writes requirements", category: "dev" },
  { name: "/dev-cycle-qa", description: "QA, merge, deploy & monitor phases", category: "dev" },
  { name: "/release", description: "Cut a versioned release: bump version, tag, push, GitHub release + changelog", category: "dev" },
  { name: "/build-mobile", description: "Build mobile app for iOS/Android via EAS", category: "dev" },
  { name: "/submit-app", description: "Submit EAS build to App Store / Google Play", category: "dev" },
  { name: "/mobile-standards", description: "React Native + Expo standards reference — load before mobile work", category: "dev" },

  // Ops
  { name: "/sync-setup", description: "Push ~/.claude/ config to git repo to keep it in sync", category: "ops" },
  { name: "/switch-model", description: "Switch the active Claude model for this session", category: "ops" },
  { name: "/auto-route", description: "Control model auto-routing — lock, unlock, or check routing config", category: "ops" },
  { name: "/ai-research", description: "Weekly AI tech research scan and evaluation pipeline", category: "ops" },

  // Meta
  { name: "/learn", description: "Add a topic to the Learning board (Project 4)", category: "meta" },
  { name: "/template", description: "Export your Claude Code setup as a public shareable template", category: "meta" },
];

export const COMMAND_CATEGORIES: { id: SlashCommand["category"]; label: string; color: string }[] = [
  { id: "workflow",  label: "Workflow",  color: "#3b82f6" },
  { id: "product",   label: "Product",   color: "#22c55e" },
  { id: "dev",       label: "Dev",       color: "#06b6d4" },
  { id: "ops",       label: "Ops",       color: "#eab308" },
  { id: "meta",      label: "Meta",      color: "#8b5cf6" },
];
