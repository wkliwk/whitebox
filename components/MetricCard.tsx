import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subtitle?: string;
}

export function MetricCard({ icon: Icon, label, value, subtitle }: MetricCardProps) {
  return (
    <div className="bg-card border border-border rounded-sm p-4 space-y-1">
      <div className="flex items-center gap-2 text-muted">
        <Icon size={14} />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      {subtitle && <div className="text-xs text-muted">{subtitle}</div>}
    </div>
  );
}
