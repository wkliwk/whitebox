export type DeployState = "READY" | "ERROR" | "BUILDING" | "QUEUED" | "CANCELED" | "unknown";

/** Maps productionUrl → latest deployment state. Returns {} on any failure or missing token. */
export async function getDeploymentStatuses(
  productionUrls: string[]
): Promise<Record<string, DeployState>> {
  if (!process.env.VERCEL_TOKEN || productionUrls.length === 0) return {};

  const token = process.env.VERCEL_TOKEN.trim();
  const results: Record<string, DeployState> = {};

  await Promise.allSettled(
    productionUrls.map(async (url) => {
      try {
        const host = new URL(url).hostname; // e.g. "money-flow-frontend-ten.vercel.app"
        const apiUrl = `https://api.vercel.com/v6/deployments?url=${encodeURIComponent(host)}&limit=1`;
        const res = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
          next: { revalidate: 120 },
        });
        if (!res.ok) return;
        const data = await res.json();
        const deployment = data?.deployments?.[0];
        if (deployment?.state) {
          results[url] = deployment.state as DeployState;
        }
      } catch { /* silent */ }
    })
  );

  return results;
}

export function deployStateColor(state: DeployState | undefined): string {
  if (!state) return "transparent";
  if (state === "READY") return "#22c55e";
  if (state === "ERROR") return "#ef4444";
  if (state === "BUILDING" || state === "QUEUED") return "#eab308";
  return "#555";
}

export function deployStateLabel(state: DeployState | undefined): string {
  if (!state) return "";
  if (state === "READY") return "Live";
  if (state === "ERROR") return "Deploy failed";
  if (state === "BUILDING") return "Building…";
  if (state === "QUEUED") return "Queued";
  if (state === "CANCELED") return "Canceled";
  return state;
}
