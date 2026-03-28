export interface CostReport {
  updatedAt: string;
  month: string;
  budget: number;
  mtdSpend: number;
  currency: string;
  byAgent: Record<string, number>;
  byCategory: Record<string, number>;
}
