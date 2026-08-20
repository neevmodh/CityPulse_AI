"use client";

import type { ElementType } from "react";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, Clock, AlertCircle, RefreshCw, Zap } from "lucide-react";

interface HistoryEntry {
  id: string;
  old_status: string;
  new_status: string;
  changed_by: string;
  notes: string;
  timestamp: string;
}

interface StatusTimelineProps {
  history: HistoryEntry[];
}

const STATUS_ICON: Record<string, ElementType> = {
  reported:    AlertCircle,
  ai_analyzed: Zap,
  verified:    CheckCircle2,
  assigned:    Clock,
  in_progress: RefreshCw,
  resolved:    CheckCircle2,
  reopened:    AlertCircle,
  closed:      CheckCircle2,
};

const STATUS_COLOR: Record<string, string> = {
  reported:    "bg-gray-100 text-gray-600",
  ai_analyzed: "bg-purple-100 text-purple-600",
  verified:    "bg-blue-100 text-blue-600",
  assigned:    "bg-yellow-100 text-yellow-700",
  in_progress: "bg-orange-100 text-orange-600",
  resolved:    "bg-green-100 text-green-600",
  reopened:    "bg-red-100 text-red-600",
  closed:      "bg-green-100 text-green-700",
};

export default function StatusTimeline({ history }: StatusTimelineProps) {
  const sorted = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-4">
      {sorted.map((entry, i) => {
        const Icon  = STATUS_ICON[entry.new_status] ?? Clock;
        const color = STATUS_COLOR[entry.new_status] ?? "bg-gray-100 text-gray-600";
        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex gap-3"
          >
            {/* Icon + vertical line */}
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              {i < sorted.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-100 my-1 min-h-4" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-gray-800 capitalize">
                  {entry.new_status.replace("_", " ")}
                </span>
                <span className="text-xs text-gray-400">{formatDate(entry.timestamp)}</span>
              </div>
              {entry.notes && (
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{entry.notes}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">by {entry.changed_by}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
