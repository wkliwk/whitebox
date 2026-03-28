import { formatDistanceToNow } from "date-fns";

export function relativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function statusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "running":
    case "in_progress":
    case "in-progress": return "var(--status-running)";
    case "active":
    case "done":
    case "merged": return "var(--status-active)";
    case "idle":
    case "todo": return "var(--status-idle)";
    case "error":
    case "blocked": return "var(--status-error)";
    default: return "var(--status-neutral)";
  }
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
