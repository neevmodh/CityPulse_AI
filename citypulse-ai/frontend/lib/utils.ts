import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { IssuePriority, IssueStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRiskColor(priority: IssuePriority): string {
  const map: Record<IssuePriority, string> = {
    critical: "text-red-600",
    high: "text-orange-500",
    medium: "text-yellow-500",
    low: "text-green-500",
  };
  return map[priority] ?? "text-gray-500";
}

export function getRiskBgColor(priority: IssuePriority): string {
  const map: Record<IssuePriority, string> = {
    critical: "bg-red-100 text-red-700 border-red-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-green-100 text-green-700 border-green-200",
  };
  return map[priority] ?? "bg-gray-100 text-gray-700 border-gray-200";
}

export function getStatusColor(status: IssueStatus | string): string {
  const map: Record<string, string> = {
    open:        "bg-red-100 text-red-700",
    ai_analyzed: "bg-purple-100 text-purple-700",
    verified:    "bg-blue-100 text-blue-700",
    assigned:    "bg-amber-100 text-amber-700",
    in_progress: "bg-blue-100 text-blue-700",
    resolved:    "bg-green-100 text-green-700",
    ai_verified: "bg-green-100 text-green-700",
    reopened:    "bg-orange-100 text-orange-700",
    closed:      "bg-gray-100 text-gray-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function timeAgo(dateStr: string): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function categoryLabel(category: string): string {
  const map: Record<string, string> = {
    pothole: "Pothole",
    streetlight: "Streetlight",
    garbage: "Garbage",
    sewage: "Sewage",
    footpath: "Footpath",
    water_leak: "Water Leak",
    road_damage: "Road Damage",
    electrical_hazard: "Electrical Hazard",
    park_damage: "Park Damage",
    tree_hazard: "Tree Hazard",
    traffic_signal: "Traffic Signal",
    other: "Other",
  };
  return map[category] ?? category;
}

export function healthScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-600";
}

export function imageUrl(path: string): string {
  if (!path) return "/placeholder-issue.png";
  if (path.startsWith("http")) return path;
  return `${process.env.NEXT_PUBLIC_API_URL}/${path}`;
}
