import { relativeTime } from "@/lib/utils";
import type { GitHubEvent } from "@/lib/github";

const verbColor = (verb: string) => {
  if (verb.includes("merged")) return "text-[var(--status-active)]";
  if (verb.includes("opened") || verb.includes("created")) return "text-[var(--status-running)]";
  return "text-muted";
};

export function ActivityFeed({ events }: { events: GitHubEvent[] }) {
  return (
    <div className="bg-card border border-border rounded-sm">
      <div className="px-4 py-2 text-xs uppercase tracking-wide text-muted font-medium border-b border-border">
        Recent Activity
      </div>
      {events.length === 0 ? (
        <div className="px-4 py-8 text-center text-xs text-muted">No recent activity</div>
      ) : (
        <div className="divide-y divide-border">
          {events.map((e, i) => (
            <div key={i} className="px-4 py-2.5 flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-xs text-muted">{e.agent} </span>
                <span className={`text-xs font-medium ${verbColor(e.verb)}`}>{e.verb} </span>
                <span className="text-xs text-foreground">{e.entityRef} </span>
                <span className="text-xs text-muted truncate">{e.entityTitle}</span>
              </div>
              {e.timestamp && (
                <span className="text-xs text-muted shrink-0">{relativeTime(e.timestamp)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
