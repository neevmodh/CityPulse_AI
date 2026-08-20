"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  LayoutDashboard, List, Map as MapIcon, CheckSquare,
  AlertTriangle, Clock, CheckCircle2, Activity, ArrowRight,
  MapPin, Filter, RefreshCw, TrendingUp, Star, Zap,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import RoleGate from "@/components/shared/RoleGate";
import RiskBadge from "@/components/dashboard/RiskBadge";
import dynamic from "next/dynamic";
import { getUser } from "@/lib/auth";
import { dashboardApi, issuesApi } from "@/lib/api";
import { getStatusColor, timeAgo, categoryLabel } from "@/lib/utils";
import type { Issue, User, WorkerDashboard } from "@/types";

const IssueMap = dynamic(() => import("@/components/maps/IssueMap"), { ssr: false });

const SIDEBAR_ITEMS = [
  { label: "Dashboard",  icon: LayoutDashboard, id: "dashboard" },
  { label: "My Queue",   icon: List,            id: "queue"     },
  { label: "Map View",   icon: MapIcon,         id: "map"       },
  { label: "Completed",  icon: CheckSquare,     id: "completed" },
];

const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-red-500 shadow-red-200",   P1: "bg-red-500 shadow-red-200",
  high:     "bg-orange-500 shadow-orange-200", P2: "bg-orange-500 shadow-orange-200",
  medium:   "bg-yellow-400",               P3: "bg-yellow-400",
  low:      "bg-green-500",                P4: "bg-green-500",
};

function slaLabel(slaDeadline: string, assignedAt: string): { label: string; urgent: boolean; pct: number } {
  // Prefer sla_deadline; fall back to 48h from created/assigned
  const deadline = slaDeadline
    ? new Date(slaDeadline).getTime()
    : new Date(assignedAt || Date.now()).getTime() + 48 * 3600000;
  const now   = Date.now();
  const total = deadline - new Date(assignedAt || Date.now()).getTime();
  const diffMs = deadline - now;
  if (diffMs <= 0) return { label: "Overdue", urgent: true, pct: 100 };
  const pct  = Math.round(((total - diffMs) / Math.max(total, 1)) * 100);
  const diffH = Math.floor(diffMs / 3600000);
  const diffM = Math.floor((diffMs % 3600000) / 60000);
  return {
    label:  diffH > 0 ? `${diffH}h left` : `${diffM}m left`,
    urgent: diffH < 6,
    pct,
  };
}

export default function WorkerDashboardPage() {
  const [user,     setUser]     = useState<User | null>(null);
  const [data,     setData]     = useState<WorkerDashboard | null>(null);
  const [issues,   setIssues]   = useState<Issue[]>([]);
  const [completed, setCompleted] = useState<Issue[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("queue");
  const [filter,   setFilter]   = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (u: User) => {
    setRefreshing(true);
    try {
      const [dash, allRes] = await Promise.all([
        dashboardApi.worker(u.id),
        issuesApi.list({ officer_id: u.id, limit: 200 }),
      ]);
      setData(dash);
      const active = allRes.issues.filter(
        (i: Issue) => !["resolved", "closed"].includes(i.status)
      );
      const done = allRes.issues.filter(
        (i: Issue) => ["resolved", "closed"].includes(i.status)
      );
      setIssues(active);
      setCompleted(done);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    if (u) load(u);
  }, [load]);

  const normP = (p: string) => {
    const s = String(p ?? "").toLowerCase();
    if (s === "p1" || s === "critical") return "critical";
    if (s === "p2" || s === "high")     return "high";
    if (s === "p3" || s === "medium")   return "medium";
    return "low";
  };

  const filtered = issues.filter(i =>
    filter === "all" ? true : normP(String(i.priority)) === filter
  );

  const criticalCount = issues.filter(i => normP(String(i.priority)) === "critical").length;
  const overdueCount  = issues.filter(i => {
    const s = slaLabel((i as any).sla_deadline ?? "", i.created_at);
    return s.label === "Overdue";
  }).length;

  const resolvedToday = completed.filter(i => {
    const today = new Date().toISOString().slice(0, 10);
    return (i.updated_at ?? "").startsWith(today);
  }).length;

  const performanceScore = completed.length > 0
    ? Math.min(100, Math.round((completed.length / Math.max(completed.length + issues.length, 1)) * 100))
    : 0;

  return (
    <RoleGate allowedRoles={["worker"]}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex flex-1 pt-16">

          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col w-56 sidebar-dark min-h-screen sticky top-16">
            <div className="px-4 py-5 border-b" style={{ borderColor: "hsl(163,40%,10%)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Officer Portal</span>
              </div>
              <p className="text-green-200 text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-green-500 text-xs truncate">{user?.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1 bg-green-900 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full" style={{ width: `${performanceScore}%` }} />
                </div>
                <span className="text-[10px] text-green-400 font-semibold">{performanceScore}%</span>
              </div>
            </div>
            <nav className="flex-1 py-4 space-y-0.5 px-2">
              {SIDEBAR_ITEMS.map(item => (
                <button key={item.id} onClick={() => setTab(item.id)}
                  className={`nav-item w-full text-left ${tab === item.id ? "active" : ""}`}>
                  <item.icon className="w-4 h-4 flex-shrink-0" />{item.label}
                  {item.id === "queue"    && issues.length > 0    && <span className="ml-auto text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">{issues.length}</span>}
                  {item.id === "completed" && completed.length > 0 && <span className="ml-auto text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded-full">{completed.length}</span>}
                </button>
              ))}
            </nav>
            <div className="p-4" style={{ borderTop: "1px solid hsl(163,40%,10%)" }}>
              <div className="flex items-center gap-1.5 text-xs text-green-500">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Ahmedabad Municipal
              </div>
            </div>
          </aside>

          <main className="flex-1 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="font-display text-2xl font-bold text-gray-900">
                  Officer Dashboard
                </motion.h1>
                <p className="text-gray-500 text-sm">
                  {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
                </p>
              </div>
              <button onClick={() => user && load(user)} disabled={refreshing}
                className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-all">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-green-600" : ""}`} />
                Refresh
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "My Active",      value: loading ? "—" : issues.length,    icon: List,          color: "text-blue-600",   bg: "bg-blue-50",   sub: `${filtered.length} after filter` },
                { label: "P1 Critical",    value: loading ? "—" : criticalCount,    icon: Zap,           color: "text-red-600",    bg: "bg-red-50",    sub: "immediate action" },
                { label: "Overdue SLA",    value: loading ? "—" : overdueCount,     icon: Clock,         color: "text-orange-600", bg: "bg-orange-50", sub: "past deadline" },
                { label: "Resolved Today", value: loading ? "—" : resolvedToday,    icon: CheckCircle2,  color: "text-green-600",  bg: "bg-green-50",  sub: `${completed.length} total closed` },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs font-medium text-gray-600 mt-0.5">{stat.label}</div>
                  <div className="text-[10px] text-gray-400">{stat.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* ── Queue tab ── */}
            {(tab === "queue" || tab === "dashboard") && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">
                    Priority Queue
                    <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-normal">
                      {filtered.length} issues
                    </span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-gray-400" />
                    {["all","critical","high","medium","low"].map(p => (
                      <button key={p} onClick={() => setFilter(p)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${
                          filter === p ? "bg-green-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-green-300"
                        }`}>
                        {p === "all" ? "All" : `P${["critical","high","medium","low"].indexOf(p)+1}`}
                      </button>
                    ))}
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-2">{Array.from({length:5}).map((_,i)=><div key={i} className="skeleton h-14 rounded-xl"/>)}</div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-green-300 mb-3" />
                    <p className="text-gray-500 font-medium">Queue clear for this filter</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Column headers */}
                    <div className="hidden md:grid grid-cols-[12px_1fr_110px_80px_80px_80px_100px] gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      <div/><div>Issue</div><div>Category</div><div>Risk</div><div>Priority</div><div>SLA</div><div/>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {filtered.map((issue, i) => {
                        const sla = slaLabel((issue as any).sla_deadline ?? "", issue.created_at);
                        return (
                          <motion.div key={issue.id}
                            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="grid grid-cols-[12px_1fr] md:grid-cols-[12px_1fr_110px_80px_80px_80px_100px] gap-3 px-4 py-3.5 hover:bg-green-50/30 transition-colors items-center">
                            {/* Priority dot */}
                            <div className={`w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0 ${PRIORITY_DOT[issue.priority] ?? "bg-gray-300"}`} />
                            {/* Title + code */}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{issue.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[10px] text-gray-400">{issue.issue_code ?? issue.id}</span>
                                <span className="flex items-center gap-1 text-[10px] text-gray-400"><MapPin className="w-2.5 h-2.5"/>{issue.ward ?? issue.ward_id}</span>
                                <span className="text-[10px] text-gray-400">{timeAgo(issue.created_at)}</span>
                              </div>
                              {/* SLA bar (mobile visible) */}
                              <div className="md:hidden mt-1.5 flex items-center gap-2">
                                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${sla.urgent ? "bg-red-500" : "bg-green-400"}`} style={{width:`${sla.pct}%`}}/>
                                </div>
                                <span className={`text-[10px] font-semibold ${sla.urgent ? "text-red-600" : "text-gray-500"}`}>{sla.label}</span>
                              </div>
                            </div>
                            <div className="hidden md:block text-xs text-gray-600 truncate capitalize">{categoryLabel(issue.category)}</div>
                            <div className="hidden md:block font-mono text-sm font-bold text-gray-700">{issue.risk_score}</div>
                            <div className="hidden md:block"><RiskBadge priority={issue.priority} size="sm" /></div>
                            {/* SLA desktop */}
                            <div className="hidden md:flex flex-col gap-1">
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${sla.urgent ? "bg-red-500" : "bg-green-400"}`} style={{width:`${sla.pct}%`}}/>
                              </div>
                              <span className={`text-[10px] font-semibold ${sla.urgent ? "text-red-600" : "text-gray-500"}`}>{sla.label}</span>
                            </div>
                            <div className="hidden md:flex items-center gap-1.5">
                              <Link href={`/worker/issues/${issue.id}`}
                                className="flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-all">
                                Open <ArrowRight className="w-3 h-3"/>
                              </Link>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Map tab ── */}
            {tab === "map" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="font-semibold text-gray-900 mb-4">My Issues — Field Map</h2>
                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 520 }}>
                  <IssueMap issues={issues} height="520px" />
                </div>
                <div className="flex gap-4 text-xs text-gray-400 mt-2 justify-center">
                  {["critical","high","medium","low"].map((p,i)=>(
                    <span key={p} className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${["bg-red-500","bg-orange-500","bg-yellow-400","bg-green-500"][i]}`}/>
                      P{i+1} {p}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Completed tab ── */}
            {tab === "completed" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">
                    Completed Issues
                    <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">{completed.length}</span>
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Star className="w-3.5 h-3.5 text-yellow-400" />
                    Performance score: <span className="font-bold text-gray-700">{performanceScore}/100</span>
                  </div>
                </div>
                {completed.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <TrendingUp className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-500">No resolved issues yet. Complete your first task!</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-50">
                      {completed.map((issue, i) => (
                        <motion.div key={issue.id}
                          initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                          className="flex items-center gap-4 px-4 py-3.5 hover:bg-green-50/20 transition-colors">
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="font-mono text-xs text-gray-400 w-24 flex-shrink-0 hidden sm:block">{issue.issue_code ?? issue.id}</span>
                          <span className="text-sm font-medium text-gray-700 flex-1 truncate">{issue.title}</span>
                          <span className="text-xs text-gray-400 hidden md:block">{issue.ward ?? issue.ward_id}</span>
                          <span className="text-xs text-gray-400 hidden md:block">{timeAgo(issue.updated_at)}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(issue.status)}`}>
                            {issue.status}
                          </span>
                          <Link href={`/worker/issues/${issue.id}`}
                            className="text-xs text-green-600 hover:underline font-medium flex-shrink-0">View</Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </RoleGate>
  );
}
