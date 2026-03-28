import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  isActive?: boolean;
}

export function MetricCard({ icon: Icon, label, value, subtitle, isActive }: MetricCardProps) {
  return (
    <div className="relative rounded p-4 flex flex-col gap-3"
      style={{ background: "#1c1c1c", border: "1px solid #2a2a2a" }}>
      {isActive && (
        <span className="absolute top-3 right-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-30" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white opacity-80" />
          </span>
        </span>
      )}
      <div className="flex items-start justify-between">
        <span className="text-3xl font-semibold text-[#e8e8e8] leading-none">{value}</span>
        {!isActive && <Icon size={14} className="text-[#444] mt-1" />}
      </div>
      <div>
        <div className="text-sm text-[#999] font-medium">{label}</div>
        {subtitle && <div className="text-xs text-[#555] mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}
