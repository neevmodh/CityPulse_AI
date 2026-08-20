"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, Clock, MapPin, ArrowRight, Star, TrendingUp, Loader2 } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import RoleGate from "@/components/shared/RoleGate";
import { getUser } from "@/lib/auth";
import { issuesApi } from "@/lib/api";
import { timeAgo, getStatusColor } from "@/lib/utils";
import type { Issue, User } from "@/types";

export default function WorkerResolvedPage() {
  const [user,     setUser]    = useState<User | null>(null);
  const [issues,   setIssues]  = useState<Issue[]>([]);
  const [loading,  setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    if (!u) return;
    issuesApi.list({ officer_id: u.id, status: "resolved", limit: 200 })
      .then(r => setIssues(r.issues))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalHours = issues.reduce((s, i) => {
    const h = parseFloat((i as any).time_taken_hours ?? "0");
    return s + (isNaN(h) ? 0 : h);
  }, 0);

  const avgHours = issues.length > 0 ? (totalHours / issues.length).toFixed(1) : "—";

  return (
    <RoleGate allowedRoles={["worker"]}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16 max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900">Resolved Issues</h1>
              <p className="text-gray-500 text-sm mt-0.5">Your complete resolution history</p>
            </div>
            <Link href="/worker/dashboard" className="text-xs text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50">
              ← Dashboard
            </Link>
          </div>

          {/* Stats */}
          {!loading && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Total Resolved", val: issues.length,    icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
                { label: "Avg Time",        val: `${avgHours}h`,   icon: Clock,        color: "text-blue-600",  bg: "bg-blue-50"  },
                { label: "Performance",     val: `${Math.min(100, issues.length * 10)}`, icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
                  <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <div className="text-xl font-bold text-gray-900">{s.val}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
                </motion.div>
              ))}
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
            </div>
          ) : issues.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <TrendingUp className="w-10 h-10 mx-auto text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium">No resolved issues yet</p>
              <p className="text-gray-400 text-sm mt-1">Complete your first task to see it here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {issues.map((issue, i) => (
                <motion.div key={issue.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-2xl border border-gray-100 hover:border-green-200 transition-all p-4 flex items-center gap-4">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{issue.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                      <span className="font-mono">{issue.issue_code ?? issue.id}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5"/>{issue.ward ?? issue.ward_id}</span>
                      <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5"/>{timeAgo(issue.updated_at)}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${getStatusColor(issue.status)}`}>
                    {issue.status}
                  </span>
                  <Link href={`/worker/issues/${issue.id}`}
                    className="text-xs text-green-600 hover:text-green-700 flex items-center gap-0.5 flex-shrink-0 font-medium">
                    View <ArrowRight className="w-3 h-3"/>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RoleGate>
  );
}
