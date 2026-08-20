"use client";

import { cn } from "@/lib/utils";
import type { IssueCategory } from "@/types";

const CATEGORIES: { value: IssueCategory; label: string; emoji: string; dept: string }[] = [
  { value: "pothole",           label: "Pothole",           emoji: "🕳️",  dept: "Roads"       },
  { value: "road_damage",       label: "Road Damage",       emoji: "🚧",  dept: "Roads"       },
  { value: "footpath",          label: "Footpath",          emoji: "🚶",  dept: "Roads"       },
  { value: "streetlight",       label: "Streetlight",       emoji: "💡",  dept: "Lighting"    },
  { value: "garbage",           label: "Garbage",           emoji: "🗑️",  dept: "Sanitation"  },
  { value: "sewage",            label: "Sewage",            emoji: "💧",  dept: "Water"       },
  { value: "water_leak",        label: "Water Leak",        emoji: "🚰",  dept: "Water"       },
  { value: "electrical_hazard", label: "Electrical Hazard", emoji: "⚡",  dept: "Emergency"   },
  { value: "tree_hazard",       label: "Fallen Tree",       emoji: "🌳",  dept: "Parks"       },
  { value: "park_damage",       label: "Park Damage",       emoji: "🏞️",  dept: "Parks"       },
  { value: "traffic_signal",    label: "Traffic Signal",    emoji: "🚦",  dept: "Traffic"     },
  { value: "other",             label: "Other",             emoji: "📋",  dept: "General"     },
];

interface CategorySelectProps {
  value: IssueCategory | "";
  onChange: (value: IssueCategory) => void;
}

export default function CategorySelect({ value, onChange }: CategorySelectProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          type="button"
          onClick={() => onChange(cat.value)}
          className={cn(
            "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all",
            value === cat.value
              ? "border-green-500 bg-green-50 text-green-700"
              : "border-gray-100 bg-white text-gray-600 hover:border-green-200 hover:bg-green-50/30"
          )}
        >
          <span className="text-xl">{cat.emoji}</span>
          <span className="leading-tight text-center">{cat.label}</span>
          <span className="text-gray-400 text-[10px]">{cat.dept}</span>
        </button>
      ))}
    </div>
  );
}
