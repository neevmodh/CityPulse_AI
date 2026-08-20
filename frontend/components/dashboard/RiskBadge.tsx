import { cn, getRiskBgColor } from "@/lib/utils";

interface RiskBadgeProps {
  priority: string;
  score?: number;
  size?: "sm" | "md";
}

// Normalize both "P1" and "critical" → canonical label
function normalize(p: string): "critical" | "high" | "medium" | "low" {
  const s = String(p ?? "").toLowerCase();
  if (s === "p1" || s === "critical") return "critical";
  if (s === "p2" || s === "high")     return "high";
  if (s === "p3" || s === "medium")   return "medium";
  return "low";
}

const LABELS = {
  critical: "P1 Critical",
  high:     "P2 High",
  medium:   "P3 Medium",
  low:      "P4 Low",
};

const DOT_COLORS = {
  critical: "bg-red-500",
  high:     "bg-orange-500",
  medium:   "bg-yellow-500",
  low:      "bg-green-500",
};

export default function RiskBadge({ priority, score, size = "md" }: RiskBadgeProps) {
  const norm = normalize(priority);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold rounded-full border",
        getRiskBgColor(norm),
        size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1"
      )}
    >
      <span className={cn(
        "rounded-full flex-shrink-0",
        size === "sm" ? "w-1 h-1" : "w-1.5 h-1.5",
        DOT_COLORS[norm]
      )} />
      {LABELS[norm]}
      {score !== undefined && <span className="opacity-70">· {score}</span>}
    </span>
  );
}
