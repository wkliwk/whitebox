"use client";
import { useEffect, useState } from "react";
import type { AgentDef } from "./agents";
import { AGENTS } from "./agents";

let cachedAgents: AgentDef[] | null = null;
let fetchPromise: Promise<AgentDef[]> | null = null;

async function fetchAgents(): Promise<AgentDef[]> {
  if (cachedAgents) return cachedAgents;
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch("/api/agents", { cache: "no-store" })
    .then(r => r.json())
    .then(d => {
      const list: AgentDef[] = d.agents ?? [];
      // Fall back to static list when local ~/.claude/agents/ not available (e.g. production)
      cachedAgents = list.length > 0 ? list : AGENTS;
      return cachedAgents!;
    })
    .catch(() => AGENTS);
  return fetchPromise;
}

export function useAgents(): AgentDef[] {
  const [agents, setAgents] = useState<AgentDef[]>(cachedAgents ?? AGENTS);
  useEffect(() => { fetchAgents().then(setAgents); }, []);
  return agents;
}
