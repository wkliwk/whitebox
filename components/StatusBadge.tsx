interface StatusBadgeProps { label: string; status?: string; }

const colorMap: Record<string, string> = {
  ceo: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  pm: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  dev: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  qa: "bg-green-500/10 text-green-400 border-green-500/20",
  ops: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  designer: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  finance: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

export function StatusBadge({ label, status }: StatusBadgeProps) {
  const key = status || label.toLowerCase();
  const cls = colorMap[key] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}
