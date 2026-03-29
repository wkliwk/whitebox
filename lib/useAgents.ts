"use client";
import { useEffect, useState } from "react";
import type { AgentDef } from "./agents";

let cachedAgents: AgentDef[] | null = null;
let fetchPromise: Promise<AgentDef[]> | null = null;

async function fetchAgents(): Promise<AgentDef[]> {
  if (cachedAgents) return cachedAgents;
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch("/api/agents", { cache: "no-store" })
    .then(r => r.json())
    .then(d => { cachedAgents = d.agents ?? []; return cachedAgents!; })
    .catch(() => []);
  return fetchPromise;
}

export function useAgents(): AgentDef[] {
  const [agents, setAgents] = useState<AgentDef[]>(cachedAgents ?? []);
  useEffect(() => { fetchAgents().then(setAgents); }, []);
  return agents;
}
