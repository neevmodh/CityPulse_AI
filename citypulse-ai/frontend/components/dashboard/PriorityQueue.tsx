"use client";

import { useState } from "react";
import IssueCard from "./IssueCard";
import { Filter } from "lucide-react";
import type { Issue, IssuePriority } from "@/types";

interface PriorityQueueProps {
  issues: Issue[];
  baseHref?: string; // e.g. "/worker/issues"
}

const FILTERS: { label: string; value: string }[] = [
  { label: "All",      value: "all"      },
  { label: "P1",       value: "critical" },
  { label: "P2",       value: "high"     },
  { label: "P3",       value: "medium"   },
  { label: "P4",       value: "low"      },
  { label: "Open",     value: "open"     },
  { label: "In Progress", value: "in_progress" },
];

export default function PriorityQueue({ issues, baseHref = "/worker/issues" }: PriorityQueueProps) {
  const [filter, setFilter] = useState("all");

  const filtered = issues.filter((issue) => {
    if (filter === "all") return true;
    if (["open", "in_progress", "resolved"].includes(filter)) return issue.status === filter;
    return issue.priority === filter;
  });

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
              filter === f.value
                ? "bg-green-500 text-white border-green-500"
                : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} issues</span>
      </div>

      {/* Issue list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No issues match this filter.</p>
          </div>
        ) : (
          filtered.map((issue, i) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              href={`${baseHref}/${issue.id}`}
              delay={i * 0.04}
              highlight={i === 0 && issue.priority === "critical"}
            />
          ))
        )}
      </div>
    </div>
  );
}
