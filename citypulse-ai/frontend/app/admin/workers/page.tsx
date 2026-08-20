"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Activity, BarChart2, Map as MapIcon, Layers, Users,
  TrendingUp, CheckCircle2, Clock, AlertTriangle,
  Star, Building2, Loader2, ArrowRight,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import RoleGate from "@/components/shared/RoleGate";
import { workersApi } from "@/lib/api";
import type { Worker, Department } from "@/types";

const ADMIN_NAV = [
  { label: "Overview",  href: "/admin/dashboard",  icon: Activity  },
  { label: "Issues",    href: "/admin/issues",      icon: Layers    },
  { label: "Hotspots",  href: "/admin/hotspots",    icon: MapIcon   },
  { label: "Analytics", href: "/admin/analytics",   icon: BarChart2 },
  { label: "Workers",   href: "/admin/workers",     icon: Users     },
];

function PerformanceBadge({ score }: { score: number }) {
  if (score >= 80) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">⭐ Top Performer</span>;
  if (score >= 50) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Active</span>;
  return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Onboarding</span>;
}

function WorkerCard({ worker, rank }: { worker: Worker; rank: number }) {
  const score = worker.performance_score ?? 0;
  const barColor = score >= 80 ? "bg-green-500" : score >= 50 ? "bg-blue-500" : "bg-gray-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: rank * 0.05 }}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-green-200 transition-all"
    >
      <div className="flex items-start gap-4">
        {/* Rank + Avatar */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            rank === 0 ? "bg-yellow-400 text-yellow-900" :
            rank === 1 ? "bg-gray-300 text-gray-700" :
            rank === 2 ? "bg-orange-300 text-orange-800" : "bg-gray-100 text-gray-500"
          }`}>
            {rank + 1}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="font-semibold text-gray-900">{worker.name}</p>
              <p className="text-xs text-gray-500 truncate">{worker.email}</p>
            </div>
            <PerformanceBadge score={score} />
          </div>

          {/* Dept */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
            <Building2 className="w-3 h-3" />
            {worker.department_id ?? "Unassigned"}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: "Assigned",  val: worker.total_issues    ?? 0, icon: AlertTriangle, color: "text-orange-500" },
              { label: "Resolved",  val: worker.resolved_issues ?? 0, icon: CheckCircle2,  color: "text-green-600"  },
              { label: "Active",    val: worker.active_issues   ?? 0, icon: Clock,         color: "text-blue-600"   },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                <s.icon className={`w-3.5 h-3.5 mx-auto mb-1 ${s.color}`} />
                <p className="text-base font-bold text-gray-900">{s.val}</p>
                <p className="text-[10px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Performance bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Performance</span>
              <span className="text-xs font-bold text-gray-700">{score}/100</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${score}%` }}
                transition={{ delay: rank * 0.05 + 0.4, duration: 0.7 }}
                className={`h-full rounded-full ${barColor}`}
              />
            </div>
          </div>

          {/* Avg resolve time */}
          {(worker.avg_resolve_hours ?? 0) > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Avg resolve: <span className="font-semibold text-gray-600">{worker.avg_resolve_hours}h</span>
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DeptCard({ dept, index }: { dept: Department; index: number }) {
  const compliance = dept.sla_compliance ?? 85;
  const resolveRate = dept.total_issues ? Math.round(((dept.resolved_issues ?? 0) / dept.total_issues) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{dept.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">SLA: {dept.sla_hours}h · {dept.active_workers} workers</p>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          compliance >= 90 ? "bg-green-100 text-green-700" :
          compliance >= 70 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
        }`}>
          {compliance}% SLA
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="bg-gray-50 rounded-xl p-2">
          <p className="text-base font-bold text-gray-900">{dept.total_issues ?? 0}</p>
          <p className="text-[10px] text-gray-400">Total</p>
        </div>
        <div className="bg-red-50 rounded-xl p-2">
          <p className="text-base font-bold text-red-600">{dept.open_issues ?? 0}</p>
          <p className="text-[10px] text-gray-400">Open</p>
        </div>
        <div className="bg-green-50 rounded-xl p-2">
          <p className="text-base font-bold text-green-600">{dept.resolved_issues ?? 0}</p>
          <p className="text-[10px] text-gray-400">Resolved</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">Resolve rate</span>
          <span className="text-xs font-bold text-gray-700">{resolveRate}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${resolveRate}%` }}
            transition={{ delay: index * 0.06 + 0.4, duration: 0.6 }}
            className={`h-full rounded-full ${resolveRate >= 50 ? "bg-green-500" : resolveRate >= 25 ? "bg-yellow-500" : "bg-red-400"}`} />
        </div>
      </div>

      {dept.head && (
        <p className="text-xs text-gray-400 mt-2.5">
          Head: <span className="font-medium text-gray-600">{dept.head}</span>
          {dept.email && <> · <a href={`mailto:${dept.email}`} className="text-green-600 hover:underline">{dept.email}</a></>}
        </p>
      )}
    </motion.div>
  );
}

export default function AdminWorkersPage() {
  const [workers,     setWorkers]     = useState<Worker[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState<"workers" | "departments">("workers");

  useEffect(() => {
    Promise.all([workersApi.performance(), workersApi.departments()])
      .then(([wRes, dRes]) => { setWorkers(wRes.workers); setDepartments(dRes.departments); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalResolved  = workers.reduce((s, w) => s + (w.resolved_issues  ?? 0), 0);
  const totalActive    = workers.reduce((s, w) => s + (w.active_issues    ?? 0), 0);
  const avgPerformance = workers.length
    ? Math.round(workers.reduce((s, w) => s + (w.performance_score ?? 0), 0) / workers.length) : 0;

  return (
    <RoleGate allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex pt-16">
          <aside className="hidden lg:flex flex-col w-56 sidebar-dark min-h-screen sticky top-16">
            <div className="px-4 py-5 border-b" style={{ borderColor: "hsl(163,40%,10%)" }}>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Admin Console</span>
              </div>
            </div>
            <nav className="flex-1 py-4 space-y-0.5 px-2">
              {ADMIN_NAV.map(item => (
                <Link key={item.href} href={item.href}
                  className={`nav-item ${item.href === "/admin/workers" ? "active" : ""}`}>
                  <item.icon className="w-4 h-4 flex-shrink-0" />{item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <main className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="font-display text-2xl font-bold text-gray-900">Workers & Departments</h1>
              <p className="text-gray-500 text-sm mt-0.5">Live performance metrics from resolved issue data</p>
            </div>

            {/* Summary KPIs */}
            {!loading && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Total Officers",   val: workers.length,     icon: Users,         color: "text-blue-600",   bg: "bg-blue-50"   },
                  { label: "Issues Resolved",  val: totalResolved,      icon: CheckCircle2,  color: "text-green-600",  bg: "bg-green-50"  },
                  { label: "Currently Active", val: totalActive,        icon: Clock,         color: "text-orange-500", bg: "bg-orange-50" },
                  { label: "Avg Performance",  val: `${avgPerformance}`, icon: Star,          color: "text-yellow-500", bg: "bg-yellow-50" },
                ].map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stat.val}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {(["workers", "departments"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
                    activeTab === tab ? "bg-green-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}>
                  {tab} ({tab === "workers" ? workers.length : departments.length})
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
              </div>
            ) : activeTab === "workers" ? (
              <>
                {workers.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <Users className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-500">No workers found. Register worker accounts to see performance data.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {workers.map((w, i) => <WorkerCard key={w.id} worker={w} rank={i} />)}
                  </div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {departments.map((d, i) => <DeptCard key={d.id} dept={d} index={i} />)}
              </div>
            )}
          </main>
        </div>
      </div>
    </RoleGate>
  );
}
