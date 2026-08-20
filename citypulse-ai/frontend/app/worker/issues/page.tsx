"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Search, Filter, ChevronDown, ArrowRight, RefreshCw,
  MapPin, Clock, AlertTriangle, CheckCircle2, Loader2, X,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import RoleGate from "@/components/shared/RoleGate";
import RiskBadge from "@/components/dashboard/RiskBadge";
import { getUser } from "@/lib/auth";
import { issuesApi } from "@/lib/api";
import { getStatusColor, timeAgo, categoryLabel } from "@/lib/utils";
import type { Issue, User } from "@/types";

const PRIORITIES = ["all", "critical", "high", "medium", "low"];
const STATUSES   = ["all", "open", "ai_analyzed", "assigned", "in_progress", "reopened"];

const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-red-500", high: "bg-orange-500", medium: "bg-yellow-400", low: "bg-green-500",
};

function slaInfo(slaDeadline: string, createdAt: string) {
  const deadline = slaDeadline
    ? new Date(slaDeadline).getTime()
    : new Date(createdAt || Date.now()).getTime() + 48 * 3600000;
  const diffMs = deadline - Date.now();
  if (diffMs <= 0) return { label: "Overdue", urgent: true };
  const h = Math.floor(diffMs / 3600000);
  return { label: h > 0 ? `${h}h left` : `${Math.floor(diffMs / 60000)}m left`, urgent: h < 6 };
}

export default function WorkerIssuesPage() {
  const [user,      setUser]      = useState<User | null>(null);
  const [issues,    setIssues]    = useState<Issue[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [search,    setSearch]    = useState("");
  const [priority,  setPriority]  = useState("all");
  const [status,    setStatus]    = useState("all");

  const load = useCallback(async (u: User) => {
    setRefreshing(true);
    try {
      const res = await issuesApi.list({
        officer_id: u.id,
        priority:   priority !== "all" ? priority : undefined,
        status:     status   !== "all" ? status   : undefined,
        limit: 200,
      });
      setIssues(res.issues.filter((i: Issue) => !["resolved","closed"].includes(i.status)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [priority, status]);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    if (u) load(u);
  }, [load]);

  const filtered = issues.filter(i =>
    !search ||
    i.title?.toLowerCase().includes(search.toLowerCase()) ||
    (i.issue_code ?? "").toLowerCase().includes(search.toLowerCase()) ||
    i.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <RoleGate allowedRoles={["worker"]}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16 max-w-5xl mx-auto px-4 py-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900">Issue Queue</h1>
              <p className="text-gray-500 text-sm mt-0.5">{filtered.length} active issue{filtered.length !== 1 ? "s" : ""} assigned to you</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/worker/dashboard" className="text-xs text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-3 py-2 rounded-xl">
                ← Dashboard
              </Link>
              <button onClick={() => user && load(user)} disabled={refreshing}
                className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-40">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search title, code, category…"
                className="input-field pl-9 py-2 text-sm" />
            </div>
            {[
              { label: "Priority", opts: PRIORITIES, val: priority, set: setPriority },
              { label: "Status",   opts: STATUSES,   val: status,   set: setStatus   },
            ].map(f => (
              <div key={f.label} className="relative">
                <select value={f.val} onChange={e => f.set(e.target.value)}
                  className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-green-400 focus:outline-none pr-7 appearance-none">
                  {f.opts.map(o => <option key={o} value={o}>{o === "all" ? `All ${f.label}s` : o}</option>)}
                </select>
                <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ))}
            {(search || priority !== "all" || status !== "all") && (
              <button onClick={() => { setSearch(""); setPriority("all"); setStatus("all"); }}
                className="flex items-center gap-1 text-xs text-orange-600 hover:underline font-medium">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          {/* Issue list */}
          {loading ? (
            <div className="space-y-2">
              {Array.from({length:6}).map((_,i)=><div key={i} className="skeleton h-20 rounded-2xl"/>)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <CheckCircle2 className="w-10 h-10 mx-auto text-green-200 mb-3" />
              <p className="text-gray-500 font-medium">No active issues{search ? " matching search" : " assigned to you"}</p>
              {search && <button onClick={() => setSearch("")} className="mt-2 text-sm text-green-600 hover:underline">Clear search</button>}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((issue, i) => {
                const sla = slaInfo((issue as any).sla_deadline ?? "", issue.created_at);
                return (
                  <motion.div key={issue.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4 p-4">
                      {/* Priority dot */}
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1.5 shadow-sm ${PRIORITY_DOT[issue.priority] ?? "bg-gray-300"}`} />
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{issue.title}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="font-mono text-[10px] text-gray-400">{issue.issue_code ?? issue.id}</span>
                              <span className="text-xs text-gray-500 capitalize">{categoryLabel(issue.category)}</span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(issue.status)}`}>
                                {issue.status.replace(/_/g, " ")}
                              </span>
                            </div>
                          </div>
                          <RiskBadge priority={issue.priority} score={Number(issue.risk_score)} size="sm" />
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{issue.ward ?? issue.ward_id}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{timeAgo(issue.created_at)}</span>
                          <span className={`flex items-center gap-1 font-semibold ${sla.urgent ? "text-red-600" : "text-gray-500"}`}>
                            {sla.urgent && <AlertTriangle className="w-3 h-3"/>}{sla.label}
                          </span>
                        </div>
                      </div>
                      {/* CTA */}
                      <Link href={`/worker/issues/${issue.id}`}
                        className="flex items-center gap-1.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl transition-all flex-shrink-0 shadow-sm">
                        Open <ArrowRight className="w-3.5 h-3.5"/>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </RoleGate>
  );
}
