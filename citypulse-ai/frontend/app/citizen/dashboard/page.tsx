"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  PlusCircle, AlertTriangle, CheckCircle2, Star,
  ArrowRight, MapPin, Clock, TrendingUp,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Sidebar from "@/components/shared/Sidebar";
import RoleGate from "@/components/shared/RoleGate";
import RiskBadge from "@/components/dashboard/RiskBadge";
import { getUser } from "@/lib/auth";
import { dashboardApi } from "@/lib/api";
import { getStatusColor, timeAgo, categoryLabel } from "@/lib/utils";
import type { User, CitizenDashboard, Issue } from "@/types";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function contributionScore(resolved: number, total: number): number {
  return Math.min(100, resolved * 12 + total * 4);
}

export default function CitizenDashboardPage() {
  const [user, setUser]         = useState<User | null>(null);
  const [data, setData]         = useState<CitizenDashboard | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    if (u) {
      dashboardApi.citizen(u.id)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, []);

  const score = data ? contributionScore(data.resolved, data.total_reported) : 0;

  return (
    <RoleGate allowedRoles={["citizen"]}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex pt-16">
          <Sidebar role="citizen" />
          <main className="flex-1 p-6 max-w-4xl">

            {/* Greeting */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <h1 className="font-display text-2xl font-bold text-gray-900">
                {getGreeting()}, {user?.name?.split(" ")[0] ?? "there"} 👋
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                Here&apos;s an overview of your civic contributions in {user?.ward ?? "your ward"}.
              </p>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {/* Active Issues */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                  </div>
                  <Link href="/citizen/track" className="text-xs text-green-600 font-medium hover:underline flex items-center gap-0.5">
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {loading ? "—" : (data?.open ?? 0) + (data?.in_progress ?? 0)}
                </div>
                <div className="text-sm text-gray-500 mt-0.5">My Active Issues</div>
                <div className="text-xs text-orange-500 mt-1">
                  {loading ? "" : `${data?.open ?? 0} open · ${data?.in_progress ?? 0} in progress`}
                </div>
              </motion.div>

              {/* Resolved This Month */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {loading ? "—" : data?.resolved ?? 0}
                </div>
                <div className="text-sm text-gray-500 mt-0.5">Resolved This Month</div>
                <div className="text-xs text-green-600 mt-1">Your reports → real fixes</div>
              </motion.div>

              {/* Contribution Score */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-500" />
                  </div>
                  <span className="text-xs font-mono text-gray-400">{score}/100</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{score}</div>
                <div className="text-sm text-gray-500 mt-0.5">Contribution Score</div>
                {/* Score bar */}
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="h-full bg-yellow-400 rounded-full"
                  />
                </div>
              </motion.div>
            </div>

            {/* Report New Issue CTA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="mb-8"
            >
              <Link
                href="/citizen/report"
                className="flex items-center justify-center gap-3 w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-semibold text-base transition-all shadow-md hover:shadow-green-200 hover:shadow-lg"
              >
                <PlusCircle className="w-5 h-5" />
                Report a New Issue
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Recent Reports */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Recent Reports</h2>
                <Link href="/citizen/track" className="text-xs text-green-600 font-medium hover:underline">
                  See all
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : !data?.recent_issues?.length ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-gray-500 text-sm">You haven&apos;t reported any issues yet.</p>
                  <Link href="/citizen/report" className="inline-block mt-3 text-green-600 text-sm font-medium hover:underline">
                    Report your first issue →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.recent_issues.map((issue: Issue, i: number) => (
                    <motion.div
                      key={issue.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.07 }}
                    >
                      <Link
                        href={`/citizen/track?issue=${issue.id}`}
                        className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:border-green-200 hover:shadow-sm transition-all"
                      >
                        {/* Category icon */}
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                          {CATEGORY_EMOJI[issue.category] ?? "📋"}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-gray-400">{issue.issue_code ?? issue.id}</span>
                            <RiskBadge priority={issue.priority} size="sm" />
                          </div>
                          <p className="text-sm font-medium text-gray-800 truncate">{issue.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{issue.ward}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(issue.created_at)}</span>
                          </div>
                        </div>

                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${getStatusColor(issue.status)}`}>
                          {issue.status.replace("_", " ")}
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

          </main>
        </div>
      </div>
    </RoleGate>
  );
}

const CATEGORY_EMOJI: Record<string, string> = {
  pothole: "🕳️", road_damage: "🚧", footpath: "🚶", streetlight: "💡",
  garbage: "🗑️", sewage: "💧", water_leak: "🚰", electrical_hazard: "⚡",
  tree_hazard: "🌳", park_damage: "🏞️", traffic_signal: "🚦",
  waterlogging: "🌊", manhole: "🕳️", other: "📋",
};
