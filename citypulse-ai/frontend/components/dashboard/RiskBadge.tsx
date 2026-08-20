import { cn, getRiskBgColor } from "@/lib/utils";
import type { IssuePriority } from "@/types";

interface RiskBadgeProps {
  priority: IssuePriority;
  score?: number;
  size?: "sm" | "md";
}

const LABELS: Record<IssuePriority, string> = {
  critical: "P1 Critical",
  high:     "P2 High",
  medium:   "P3 Medium",
  low:      "P4 Low",
};

export default function RiskBadge({ priority, score, size = "md" }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold rounded-full border",
        getRiskBgColor(priority),
        size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1"
      )}
    >
      <span className={cn(
        "rounded-full flex-shrink-0",
        size === "sm" ? "w-1 h-1" : "w-1.5 h-1.5",
        priority === "critical" ? "bg-red-500" :
        priority === "high"     ? "bg-orange-500" :
        priority === "medium"   ? "bg-yellow-500" : "bg-green-500"
      )} />
      {LABELS[priority]}
      {score !== undefined && <span className="opacity-70">· {score}</span>}
    </span>
  );
}
