"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Activity, AlertTriangle, CheckCircle2, Clock, TrendingUp,
  TrendingDown, Minus, RefreshCw, MapPin, ArrowRight,
  BarChart2, Map, Layers, Users, Zap, Building2, X,
  ChevronDown, Search,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import RoleGate from "@/components/shared/RoleGate";
import CityHealthScore from "@/components/dashboard/CityHealthScore";
import RiskBadge from "@/components/dashboard/RiskBadge";
import { assignmentsApi, dashboardApi, issuesApi, workersApi } from "@/lib/api";
import { categoryLabel, timeAgo, getStatusColor } from "@/lib/utils";
import type { AdminDashboard, Issue, Ward, Worker, Department } from "@/types";
import toast from "react-hot-toast";

const IssueMap   = dynamic(() => import("@/components/maps/IssueMap"),   { ssr: false });
const HotspotMap = dynamic(() => import("@/components/maps/HotspotMap"), { ssr: false });
const HeatMap    = dynamic(() => import("@/components/maps/HeatMap"),    { ssr: false });

type MapMode = "issues" | "hotspots" | "complaints" | "risk";

const ADMIN_NAV = [
  { label: "Overview",  href: "/admin/dashboard",  icon: Activity   },
  { label: "Issues",    href: "/admin/issues",      icon: Layers     },
  { label: "Hotspots",  href: "/admin/hotspots",    icon: Map        },
  { label: "Analytics", href: "/admin/analytics",   icon: BarChart2  },
  { label: "Workers",   href: "/admin/workers",     icon: Users      },
];

/* ── Ward Health Row ──────────────────────────────────────────────────────── */
function WardRow({ ward, index }: { ward: Ward; index: number }) {
  const score = Number(ward.health_score);
  const trend = score >= 75 ? "up" : score >= 60 ? "flat" : "down";
  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="border-b border-gray-50 hover:bg-green-50/40 transition-colors"
    >
      <td className="py-3 px-4 text-sm font-medium text-gray-800">{ward.name}</td>
      <td className="py-3 px-4 text-sm text-gray-600 text-center">{ward.total_issues}</td>
      <td className="py-3 px-4 text-center">
        <span className="text-sm font-bold text-red-600">{ward.open_issues}</span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-sm font-bold text-green-600">{ward.resolved_issues}</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, score)}%` }}
              transition={{ delay: index * 0.04 + 0.3, duration: 0.6 }}
              className={`h-full rounded-full ${score >= 75 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
            />
          </div>
          <span className={`text-xs font-bold w-7 ${score >= 75 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600"}`}>
            {score}
          </span>
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        {trend === "up"   && <span className="flex items-center justify-center gap-1 text-xs text-green-600 font-medium"><TrendingUp className="w-3 h-3" />Up</span>}
        {trend === "down" && <span className="flex items-center justify-center gap-1 text-xs text-red-600 font-medium"><TrendingDown className="w-3 h-3" />Down</span>}
        {trend === "flat" && <span className="flex items-center justify-center gap-1 text-xs text-gray-400 font-medium"><Minus className="w-3 h-3" />Stable</span>}
      </td>
    </motion.tr>
  );
}

/* ── Assign Popover ───────────────────────────────────────────────────────── */
function AssignPopover({
  issue, workers, departments, onAssigned, onClose,
}: {
  issue: Issue;
  workers: Worker[];
  departments: Department[];
  onAssigned: () => void;
  onClose: () => void;
}) {
  const [workerId,  setWorkerId]  = useState(workers[0]?.id ?? "");
  const [deptId,    setDeptId]    = useState(departments[0]?.id ?? "");
  const [notes,     setNotes]     = useState("");
  const [assigning, setAssigning] = useState(false);

  // Auto-match dept to worker's dept
  useEffect(() => {
    const w = workers.find(w => w.id === workerId);
    if (w?.department_id) setDeptId(w.department_id);
  }, [workerId, workers]);

  const assign = async () => {
    if (!workerId || !deptId) return;
    setAssigning(true);
    try {
      await assignmentsApi.assign({ issue_id: issue.id, officer_id: workerId, department_id: deptId, notes });
      toast.success(`${issue.issue_code ?? issue.id} assigned`);
      onAssigned();
      onClose();
    } catch {
      toast.error("Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute left-0 right-0 top-full z-20 mt-1 bg-white border border-green-200 rounded-xl shadow-xl p-3 space-y-2"
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-gray-700">Assign to Officer</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
      </div>
      <select value={workerId} onChange={e => setWorkerId(e.target.value)}
        className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-green-400 focus:outline-none">
        {workers.map(w => (
          <option key={w.id} value={w.id}>{w.name} · {w.department_id ?? "Unassigned"}</option>
        ))}
      </select>
      <select value={deptId} onChange={e => setDeptId(e.target.value)}
        className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-green-400 focus:outline-none">
        {departments.map(d => (
          <option key={d.id} value={d.id}>{d.name} · SLA {d.sla_hours}h</option>
        ))}
      </select>
      <input value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="Optional note…"
        className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-green-400 focus:outline-none" />
      <button onClick={assign} disabled={assigning || !workerId || !deptId}
        className="w-full text-xs font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 py-1.5 rounded-lg transition-all">
        {assigning ? "Assigning…" : "Confirm Assignment"}
      </button>
    </motion.div>
  );
}

/* ── Critical Feed Item ───────────────────────────────────────────────────── */
function CriticalFeedItem({
  issue, index, workers, departments, onAssigned,
}: {
  issue: Issue; index: number;
  workers: Worker[]; departments: Department[];
  onAssigned: () => void;
}) {
  const [showAssign, setShowAssign] = useState(false);
  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.06 }}
        className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0"
      >
        <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0 animate-pulse" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <RiskBadge priority={issue.priority} size="sm" />
            <span className="font-mono text-[10px] text-gray-400">{issue.issue_code ?? issue.id}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${getStatusColor(issue.status)}`}>
              {issue.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-800 truncate">{issue.title}</p>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{issue.ward ?? issue.ward_id}</span>
            <span>{timeAgo(issue.created_at)}</span>
            <span className="font-mono font-bold text-gray-600">{issue.risk_score}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {issue.status !== "resolved" && issue.status !== "closed" && (
            <button onClick={() => setShowAssign(v => !v)}
              className="text-xs text-white bg-green-600 hover:bg-green-700 px-2.5 py-1.5 rounded-lg font-semibold transition-all">
              Assign
            </button>
          )}
          <Link href={`/worker/issues/${issue.id}`}
            className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-0.5">
            View <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </motion.div>

      <AnimatePresence>
        {showAssign && (
          <AssignPopover
            issue={issue} workers={workers} departments={departments}
            onAssigned={onAssigned} onClose={() => setShowAssign(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────────── */
export default function AdminDashboardPage() {
  const [data,        setData]        = useState<AdminDashboard | null>(null);
  const [allIssues,   setAllIssues]   = useState<Issue[]>([]);
  const [workers,     setWorkers]     = useState<Worker[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [mapMode,     setMapMode]     = useState<MapMode>("issues");
  const [heatCells,   setHeatCells]   = useState<any[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing,  setRefreshing]  = useState(false);
  const [searchQ,     setSearchQ]     = useState("");

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [dash, issueRes, wRes, dRes, heat] = await Promise.all([
        dashboardApi.admin(),
        issuesApi.list({ limit: 300 }),
        workersApi.list(),
        workersApi.departments(),
        dashboardApi.heatmap(mapMode === "complaints" ? "complaints" : "risk"),
      ]);
      setData(dash as any);
      setAllIssues(issueRes.issues);
      setWorkers(wRes.workers);
      setDepartments(dRes.departments);
      setHeatCells(heat.cells ?? []);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mapMode]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const criticalIssues = allIssues
    .filter(i => {
      const p = String(i.priority);
      return (p === "critical" || p === "P1") && i.status !== "resolved" && i.status !== "closed";
    })
    .filter(i => !searchQ || i.title?.toLowerCase().includes(searchQ.toLowerCase()) || i.issue_code?.toLowerCase().includes(searchQ.toLowerCase()))
    .slice(0, 10);

  const avgHealthScore = data
    ? Math.round((data.wards ?? []).reduce((s, w) => s + Number(w.health_score), 0) / Math.max((data.wards ?? []).length, 1))
    : 0;

  const resolvedToday = allIssues.filter(i => {
    if (i.status !== "resolved") return false;
    const today = new Date().toISOString().slice(0, 10);
    return (i.updated_at ?? "").startsWith(today);
  }).length;

  const avgResponseDays = (data as any)?.avg_response_days ?? 0;

  return (
    <RoleGate allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex pt-16">

          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col w-56 sidebar-dark min-h-screen sticky top-16">
            <div className="px-4 py-5 border-b" style={{ borderColor: "hsl(163,40%,10%)" }}>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Admin Console</span>
              </div>
              <p className="text-green-300 text-sm font-medium mt-1">Ahmedabad Municipal</p>
            </div>
            <nav className="flex-1 py-4 space-y-0.5 px-2">
              {ADMIN_NAV.map(item => (
                <Link key={item.href} href={item.href}
                  className={`nav-item ${item.href === "/admin/dashboard" ? "active" : ""}`}>
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-4" style={{ borderTop: "1px solid hsl(163,40%,10%)" }}>
              <div className="flex items-center gap-1.5 text-xs text-green-500">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                System Online · {allIssues.length} issues
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 p-6 overflow-auto max-w-[calc(100vw-224px)]">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-gray-900">City Overview</h1>
                <p className="text-gray-500 text-sm mt-0.5">Ahmedabad Municipal Corporation · Real-time command center</p>
              </div>
              <button onClick={fetchData} disabled={refreshing}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-3 py-2 rounded-xl transition-all hover:shadow-sm">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-green-600" : ""}`} />
                {refreshing ? "Refreshing…" : `${lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
              </button>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col items-center justify-center">
                {loading
                  ? <div className="w-28 h-28 bg-gray-100 rounded-full animate-pulse" />
                  : <CityHealthScore score={avgHealthScore} label="City Health" />}
              </motion.div>

              {[
                { label: "Active Issues",   value: loading ? "—" : data?.open_issues   ?? 0,   icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50", sub: `${allIssues.filter(i => i.status === "in_progress").length} in progress` },
                { label: "P1 Critical",     value: loading ? "—" : data?.critical_issues ?? 0, icon: Zap,           color: "text-red-600",    bg: "bg-red-50",    sub: "Immediate action needed" },
                { label: "Resolved Today",  value: loading ? "—" : resolvedToday,               icon: CheckCircle2,  color: "text-green-600",  bg: "bg-green-50",  sub: `${data?.active_hotspots ?? 0} hotspot clusters` },
                { label: "Avg Response",    value: loading ? "—" : `${avgResponseDays}d`,       icon: Clock,         color: "text-blue-600",   bg: "bg-blue-50",   sub: `${departments.length} departments` },
              ].map((kpi, i) => (
                <motion.div key={kpi.label}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
                  <div className={`w-9 h-9 ${kpi.bg} rounded-xl flex items-center justify-center mb-3`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{kpi.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5 font-medium">{kpi.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{kpi.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* Map panel */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-green-600" /> City Intelligence Map
                </h2>
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                  {([
                    { mode: "issues"     as MapMode, label: "Pins"      },
                    { mode: "hotspots"   as MapMode, label: "Hotspots"  },
                    { mode: "complaints" as MapMode, label: "Density"   },
                    { mode: "risk"       as MapMode, label: "Risk Heat" },
                  ]).map(({ mode, label }) => (
                    <button key={mode} onClick={() => setMapMode(mode)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                        mapMode === mode ? "bg-white text-green-700 shadow-sm font-semibold" : "text-gray-500 hover:text-gray-700"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ height: 400 }}>
                {mapMode === "issues"
                  ? <IssueMap issues={allIssues} height="400px" />
                  : mapMode === "hotspots"
                  ? <HotspotMap hotspots={data?.hotspots ?? []} height="400px" />
                  : <HeatMap cells={heatCells} height="400px" kind={mapMode as any} />
                }
              </div>
              <div className="px-5 py-2 border-t border-gray-50 flex flex-wrap gap-4 text-xs text-gray-400 items-center">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />P1 Critical</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" />P2 High</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" />P3 Medium</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />P4 Low</span>
                <span className="ml-auto font-medium text-gray-500">{allIssues.length} total issues plotted</span>
              </div>
            </motion.div>

            {/* Bottom: Ward table + Critical feed */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

              {/* Ward table */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-green-600" /> Ward Health
                  </h2>
                  <Link href="/admin/analytics" className="text-xs text-green-600 hover:underline flex items-center gap-1 font-medium">
                    Full analytics <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full data-table">
                    <thead>
                      <tr>
                        {["Ward", "Total", "Open", "Resolved", "Health", "Trend"].map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading
                        ? Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i}><td colSpan={6}><div className="skeleton h-4 w-full" /></td></tr>
                        ))
                        : (data?.wards ?? []).map((ward, i) => (
                          <WardRow key={ward.id} ward={ward} index={i} />
                        ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Critical feed */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      Critical Feed
                    </h2>
                    <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-full">auto-refresh 30s</span>
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                      placeholder="Filter by title or code…"
                      className="w-full text-xs border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 focus:ring-2 focus:ring-green-400 focus:outline-none" />
                  </div>
                </div>
                <div className="flex-1 px-5 py-1 max-h-[420px] overflow-y-auto">
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="py-3 border-b border-gray-50">
                        <div className="skeleton h-4 w-4/5 mb-1.5" /><div className="skeleton h-3 w-3/5" />
                      </div>
                    ))
                    : criticalIssues.length === 0
                    ? (
                      <div className="py-10 text-center">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-green-300 mb-2" />
                        <p className="text-sm text-gray-400">No critical issues right now.</p>
                      </div>
                    )
                    : criticalIssues.map((issue, i) => (
                      <CriticalFeedItem
                        key={issue.id} issue={issue} index={i}
                        workers={workers} departments={departments}
                        onAssigned={fetchData}
                      />
                    ))
                  }
                </div>
                <div className="px-5 py-3 border-t border-gray-50">
                  <Link href="/admin/issues" className="text-xs text-green-600 hover:underline flex items-center gap-1 font-medium">
                    Manage all issues <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>

            </div>
          </main>
        </div>
      </div>
    </RoleGate>
  );
}
