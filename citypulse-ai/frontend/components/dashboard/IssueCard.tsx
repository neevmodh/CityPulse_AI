"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import RiskBadge from "./RiskBadge";
import { getStatusColor, timeAgo, categoryLabel, imageUrl } from "@/lib/utils";
import type { Issue } from "@/types";

interface IssueCardProps {
  issue: Issue;
  href?: string;
  delay?: number;
  showAssignee?: boolean;
  highlight?: boolean;
}

export default function IssueCard({ issue, href, delay = 0, showAssignee, highlight = false }: IssueCardProps) {
  const card = (
    <motion.div
      initial={{ opacity: 0, y: highlight ? -24 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`bg-white rounded-xl border border-gray-100 p-4 hover:border-green-200 hover:shadow-md transition-all cursor-pointer group ${highlight ? "priority-entry-pulse" : ""}`}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
          {issue.image_path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl(issue.image_path)}
              alt={issue.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📷</div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 leading-tight truncate">{issue.title}</h3>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-green-500 flex-shrink-0 transition-colors" />
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <RiskBadge priority={issue.priority} score={Number(issue.risk_score)} size="sm" />
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(issue.status)}`}>
              {issue.status.replace("_", " ")}
            </span>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
              {categoryLabel(issue.category)}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {issue.ward}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(issue.created_at)}
            </span>
            {issue.issue_code && (
              <span className="font-mono text-gray-300">{issue.issue_code}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{card}</Link>;
  }
  return card;
}
