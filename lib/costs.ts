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
