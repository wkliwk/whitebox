export interface CostReport {
  updatedAt: string;
  month: string;
  budget: number;
  mtdSpend: number;
  currency: string;
  byAgent: Record<string, number>;
  byCategory: Record<string, number>;
}

/** Sonnet 4.6 pricing in USD per million tokens */
export const PRICING = {
  inputPerMTok: 3.0,
  outputPerMTok: 15.0,
} as const;

/** Format a cost in USD cents as a short dollar string (e.g. 2014 → "$20.14") */
export function formatSpend(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Compute budget utilisation percentage (0-100) */
export function budgetPct(report: CostReport): number {
  if (!report.budget) return 0;
  return Math.min(100, Math.round((report.mtdSpend / report.budget) * 100));
}

/**
 * Read costs.json from cwd and push a daily snapshot to Redis.
 * Fire-and-forget — never throws.
 */
export async function writeDailyCostSnapshot(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path") as typeof import("path");
    const raw = fs.readFileSync(path.join(process.cwd(), "costs.json"), "utf-8");
    const report = JSON.parse(raw) as CostReport;
    const { pushCostSnapshot } = await import("./redis");
    await pushCostSnapshot({
      date: new Date().toISOString().slice(0, 10),
      totalSpend: report.mtdSpend,
      byAgent: report.byAgent ?? {},
    });
  } catch { /* silent — costs.json may not exist on Vercel */ }
}
