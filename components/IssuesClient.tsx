"use client";

import { useEffect, useRef, useState } from "react";
import { IssuesFilter } from "@/components/IssuesFilter";
import type { RecentTask } from "@/lib/github";

interface Props {
  initialTasks: RecentTask[];
  initialQuery?: string;
  activeRepo?: string;
}

export function IssuesClient({ initialTasks, initialQuery = "", activeRepo }: Props) {
  const [tasks, setTasks] = useState<RecentTask[]>(initialTasks);
  const [secondsSince, setSecondsSince] = useState(0);
  const lastFetchedAt = useRef<number>(0);
  const pollingActive = useRef(true);

  async function refresh() {
    if (!pollingActive.current) return;
    try {
      const res = await fetch("/api/issues", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks ?? []);
        lastFetchedAt.current = Date.now();
        setSecondsSince(0);
      }
    } catch { /* retain current */ }
  }

  useEffect(() => {
    pollingActive.current = true;
    const interval = setInterval(refresh, 30000);
    const onVisibility = () => {
      if (document.hidden) { pollingActive.current = false; }
      else { pollingActive.current = true; refresh(); }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      pollingActive.current = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const tickId = setInterval(() => {
      if (lastFetchedAt.current > 0) setSecondsSince(Math.floor((Date.now() - lastFetchedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(tickId);
  }, []);

  const repoFiltered = activeRepo ? tasks.filter(t => t.repo === activeRepo) : tasks;
  const agoLabel = lastFetchedAt.current > 0
    ? (secondsSince < 5 ? "just now" : `${secondsSince}s ago`)
    : null;

  return (
    <div>
      {agoLabel && (
        <div className="flex justify-end mb-2">
          <span className="text-[10px] text-[#444]">Updated {agoLabel}</span>
        </div>
      )}
      <IssuesFilter tasks={repoFiltered} initialQuery={initialQuery} />
    </div>
  );
}
