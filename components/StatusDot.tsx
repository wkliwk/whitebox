interface StatusDotProps {
  status: "running" | "idle" | "error" | "paused" | "active";
  size?: "sm" | "md";
}

export function StatusDot({ status, size = "md" }: StatusDotProps) {
  const sz = size === "sm" ? "w-2 h-2" : "w-3 h-3";
  const colorMap: Record<string, string> = {
    running: "bg-[var(--status-running)]",
    active: "bg-[var(--status-active)]",
    idle: "bg-[var(--status-idle)]",
    error: "bg-[var(--status-error)]",
    paused: "bg-[var(--status-paused)]",
  };
  const color = colorMap[status] || "bg-[var(--status-neutral)]";

  return (
    <span className="relative flex items-center justify-center">
      {status === "running" && (
        <span className={`absolute inline-flex ${sz} rounded-full opacity-75 ${color} animate-ping`} />
      )}
      <span className={`relative inline-flex rounded-full ${sz} ${color}`} />
    </span>
  );
}
