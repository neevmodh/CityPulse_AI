"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import {
  Activity, BarChart2, Map as MapIcon, TrendingUp, TrendingDown,
  ArrowUpDown, Loader2, Users, Layers, RefreshCw, Download,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import RoleGate from "@/components/shared/RoleGate";
import { dashboardApi, workersApi } from "@/lib/api";
import type { Ward } from "@/types";

const ADMIN_NAV = [
  { label: "Overview",  href: "/admin/dashboard",  icon: Activity  },
  { label: "Issues",    href: "/admin/issues",      icon: Layers    },
  { label: "Hotspots",  href: "/admin/hotspots",    icon: MapIcon   },
  { label: "Analytics", href: "/admin/analytics",   icon: BarChart2 },
  { label: "Workers",   href: "/admin/workers",     icon: Users     },
];

const GREEN_PALETTE = ["#16a34a","#22c55e","#4ade80","#86efac","#bbf7d0","#dcfce7","#a3e635","#34d399"];
const STATUS_COLORS: Record<string, string> = {
  open: "#ef4444", in_progress: "#3b82f6", resolved: "#22c55e",
  assigned: "#eab308", verified: "#8b5cf6", reopened: "#f97316", ai_analyzed: "#a855f7", closed: "#6b7280",
};
const PRIORITY_COLORS: Record<string, string> = {
  "P1 Critical": "#ef4444", "P2 High": "#f97316", "P3 Medium": "#eab308", "P4 Low": "#22c55e",
  critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#22c55e",
  P1: "#ef4444", P2: "#f97316", P3: "#eab308", P4: "#22c55e",
};

/* Custom tooltip */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-green-100 rounded-xl shadow-lg px-3 py-2.5 text-xs">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-bold text-gray-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

function ChartCard({ title, subtitle, children, delay = 0, action }: {
  title: string; subtitle?: string; children: React.ReactNode; delay?: number; action?: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

type SortKey = "name" | "total_issues" | "open_issues" | "resolved_issues" | "health_score";

function WardTable({ wards }: { wards: Ward[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("health_score");
  const [sortAsc, setSortAsc] = useState(false);
  const router = useRouter();

  const sorted = [...wards].sort((a, b) => {
    const va = sortKey === "name" ? a.name : Number(a[sortKey]);
    const vb = sortKey === "name" ? b.name : Number(b[sortKey]);
    return sortAsc ? (va < vb ? -1 : 1) : (va > vb ? -1 : 1);
  });

  const TH = ({ label, k }: { label: string; k: SortKey }) => (
    <th onClick={() => { setSortKey(k); setSortAsc(s => sortKey === k ? !s : false); }}
      className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-green-600 select-none whitespace-nowrap">
      <span className="flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3 opacity-40" /></span>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full data-table">
        <thead>
          <tr>
            <TH label="Ward" k="name" />
            <TH label="Total" k="total_issues" />
            <TH label="Open" k="open_issues" />
            <TH label="Resolved" k="resolved_issues" />
            <TH label="Health" k="health_score" />
            <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Trend</th>
            <th className="py-2.5 px-4" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((ward, i) => {
            const score = Number(ward.health_score);
            return (
              <motion.tr key={ward.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="border-b border-gray-50 hover:bg-green-50/30 transition-colors">
                <td className="py-3 px-4 font-medium text-gray-800">{ward.name}</td>
                <td className="py-3 px-4 text-gray-600 text-center">{ward.total_issues}</td>
                <td className="py-3 px-4 text-center font-bold text-red-500">{ward.open_issues}</td>
                <td className="py-3 px-4 text-center font-bold text-green-600">{ward.resolved_issues}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${score >= 75 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${score}%` }} />
                    </div>
                    <span className={`text-xs font-bold ${score >= 75 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600"}`}>{score}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {score >= 75
                    ? <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><TrendingUp className="w-3 h-3" />Up</span>
                    : <span className="flex items-center gap-1 text-xs text-red-500 font-medium"><TrendingDown className="w-3 h-3" />Down</span>}
                </td>
                <td className="py-3 px-4">
                  <button onClick={() => router.push(`/admin/analytics?ward=${ward.id}`)}
                    className="text-xs text-green-600 hover:underline font-medium">Inspect</button>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const [wardFilter,     setWardFilter]     = useState(searchParams.get("ward") ?? "all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [analytics,      setAnalytics]      = useState<any>(null);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);

  const load = useCallback(async (ward?: string, cat?: string) => {
    setRefreshing(true);
    try {
      const params: Record<string, any> = {};
      if (ward && ward !== "all") params.ward_id = ward;
      if (cat && cat !== "all") params.category = cat;
      const data = await dashboardApi.analytics(params.ward_id, 30);
      setAnalytics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(wardFilter, categoryFilter); }, []);

  const handleWardChange = (w: string) => {
    setWardFilter(w);
    load(w, categoryFilter);
  };
  const handleCatChange = (c: string) => {
    setCategoryFilter(c);
    load(wardFilter, c);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
    </div>
  );

  /* ── Build chart data ──────────────────────────────────────────────────── */
  const catData = Object.entries(analytics?.by_category ?? {})
    .map(([name, count]) => ({ name: name.replace(/_/g, " "), count: count as number }))
    .sort((a, b) => b.count - a.count);

  const filteredCatData = categoryFilter === "all" ? catData
    : catData.filter(c => c.name === categoryFilter.replace(/_/g, " "));

  const statusData = Object.entries(analytics?.by_status ?? {})
    .map(([name, value]) => ({ name, value: value as number, color: STATUS_COLORS[name] ?? "#6b7280" }));

  const weeklyData: any[] = analytics?.weekly_trend ?? [];

  /* dept resolution — from real API, fallback to empty */
  const deptResolution: any[] = analytics?.dept_resolution ?? [];

  /* priority — from real API */
  const priorityData = Object.entries(analytics?.priority_counts ?? {})
    .map(([name, value]) => ({ name, value: value as number, color: PRIORITY_COLORS[name] ?? "#6b7280" }))
    .sort((a, b) => {
      const order: Record<string, number> = { "P1 Critical": 0, "P2 High": 1, "P3 Medium": 2, "P4 Low": 3 };
      return (order[a.name] ?? 9) - (order[b.name] ?? 9);
    });

  const wardVolume = Object.entries(analytics?.by_ward ?? {})
    .map(([ward, count]) => ({ ward, count }))
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 12);

  /* radar — category distribution normalised */
  const radarData = catData.slice(0, 6).map(c => ({
    category: c.name.slice(0, 10),
    count: c.count,
    fullMark: catData[0]?.count ?? 1,
  }));

  const totalResolved = analytics?.by_status?.resolved ?? 0;
  const totalIssues   = analytics?.total ?? 1;
  const resolveRate   = Math.round((totalResolved / totalIssues) * 100);

  const exportCSV = () => {
    const rows = [
      ["Category", "Count"],
      ...catData.map(c => [c.name, c.count]),
    ];
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "citypulse_analytics.csv";
    a.click();
  };

  return (
    <div className="space-y-6">

      {/* Filter bar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Ward:</span>
          <select value={wardFilter} onChange={e => handleWardChange(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
            <option value="all">All Wards</option>
            {Object.keys(analytics?.by_ward ?? {}).map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Category:</span>
          <select value={categoryFilter} onChange={e => handleCatChange(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
            <option value="all">All Categories</option>
            {catData.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {(wardFilter !== "all" || categoryFilter !== "all") && (
            <button onClick={() => { setWardFilter("all"); setCategoryFilter("all"); load("all", "all"); }}
              className="text-xs text-orange-600 hover:underline font-medium">Clear filters</button>
          )}
          <button onClick={() => load(wardFilter, categoryFilter)} disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all">
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-all font-medium">
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
        {/* Quick stat pills */}
        <div className="w-full flex flex-wrap gap-2 mt-1">
          {[
            { label: "Total Issues",    val: analytics?.total ?? 0,    color: "bg-gray-100 text-gray-700"   },
            { label: "Resolved",        val: totalResolved,             color: "bg-green-100 text-green-700" },
            { label: "Resolve Rate",    val: `${resolveRate}%`,         color: "bg-blue-100 text-blue-700"   },
            { label: "Categories",      val: catData.length,            color: "bg-purple-100 text-purple-700"},
          ].map(s => (
            <span key={s.label} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>
              {s.label}: <strong>{s.val}</strong>
            </span>
          ))}
        </div>
      </motion.div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* 1. Issues by category */}
        <ChartCard title="Issues by Category" subtitle={`${filteredCatData.length} categories · sorted by volume`} delay={0.05}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={filteredCatData} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={52} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Issues" radius={[4, 4, 0, 0]}>
                {filteredCatData.map((_, i) => (
                  <Cell key={i} fill={GREEN_PALETTE[i % GREEN_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 2. Weekly trend (REAL from API) */}
        <ChartCard title="Weekly Reported vs Resolved" subtitle="Last 8 weeks · from live data" delay={0.1}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="gradReported" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="reported" stroke="#16a34a" strokeWidth={2.5}
                fill="url(#gradReported)" dot={{ r: 4, fill: "#16a34a" }} name="Reported" />
              <Area type="monotone" dataKey="resolved" stroke="#4ade80" strokeWidth={2}
                fill="url(#gradResolved)" dot={{ r: 3, fill: "#4ade80" }} name="Resolved" strokeDasharray="5 3" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 3. Status donut */}
        <ChartCard title="Status Distribution" subtitle="Current snapshot" delay={0.15}>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="45%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={48} outerRadius={78}
                  dataKey="value" paddingAngle={3}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 flex-1">
              {statusData.sort((a, b) => b.value - a.value).map(s => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-gray-600 capitalize flex-1">{s.name.replace(/_/g, " ")}</span>
                  <span className="font-bold text-gray-800">{s.value}</span>
                  <span className="text-gray-400">({Math.round((s.value / (analytics?.total || 1)) * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* 4. Dept resolution time (REAL from API) */}
        <ChartCard title="Avg Resolution Time by Department"
          subtitle={deptResolution.length ? "From live resolution records" : "Insufficient resolved data yet"}
          delay={0.2}>
          {deptResolution.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No resolution data yet — resolve some issues first.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptResolution} layout="vertical" barSize={13}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="d" />
                  <YAxis dataKey="dept" type="category" tick={{ fontSize: 10 }} width={72} />
                  <Tooltip content={<CustomTooltip />} formatter={(v: any) => [`${v} days`]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="avg_days" name="Actual (days)" radius={[0, 4, 4, 0]}>
                    {deptResolution.map((d, i) => (
                      <Cell key={i} fill={d.avg_days > d.target ? "#f97316" : "#22c55e"} />
                    ))}
                  </Bar>
                  <Bar dataKey="target" name="SLA Target" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-gray-400 mt-1">🟠 Over SLA &nbsp;🟢 Within SLA</p>
            </>
          )}
        </ChartCard>

        {/* 5. Priority distribution (REAL from API) */}
        <ChartCard title="Priority Distribution" subtitle="From actual risk engine scores" delay={0.25}>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" outerRadius={72} dataKey="value" paddingAngle={4}>
                  {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3 flex-1">
              {priorityData.map(p => (
                <div key={p.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }} />
                  <span className="text-xs text-gray-600 flex-1">{p.name}</span>
                  <span className="text-sm font-bold text-gray-800">{p.value}</span>
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ background: p.color, width: `${Math.round((p.value / (analytics?.total || 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* 6. Ward volume bar */}
        <ChartCard title="Issue Volume by Ward" subtitle="Top 12 wards" delay={0.3}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={wardVolume} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
              <XAxis dataKey="ward" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Issues" radius={[4, 4, 0, 0]}>
                {wardVolume.map((_, i) => <Cell key={i} fill={GREEN_PALETTE[i % GREEN_PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 7. Radar — category spread */}
        <ChartCard title="Category Radar" subtitle="Top 6 categories by volume" delay={0.35}>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={80}>
              <PolarGrid stroke="#f0fdf4" />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
              <Radar name="Issues" dataKey="count" stroke="#16a34a" fill="#16a34a" fillOpacity={0.2} strokeWidth={2} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 8. Resolved rate progress bars per ward */}
        <ChartCard title="Resolution Rate by Ward" subtitle="Resolved ÷ Total issues" delay={0.4}>
          <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
            {(analytics?.wards ?? [])
              .map((w: any) => ({
                name:  w.name,
                rate:  w.total_issues > 0 ? Math.round((Number(w.resolved_issues) / Number(w.total_issues)) * 100) : 0,
                total: Number(w.total_issues),
              }))
              .sort((a: any, b: any) => b.rate - a.rate)
              .map((w: any, i: number) => (
                <div key={w.name} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-28 truncate flex-shrink-0">{w.name}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${w.rate}%` }}
                      transition={{ delay: i * 0.03 + 0.5, duration: 0.5 }}
                      className={`h-full rounded-full ${w.rate >= 50 ? "bg-green-500" : w.rate >= 25 ? "bg-yellow-500" : "bg-red-400"}`} />
                  </div>
                  <span className="text-xs font-bold w-10 text-right text-gray-700">{w.rate}%</span>
                  <span className="text-[10px] text-gray-400 w-12 text-right">{w.total} total</span>
                </div>
              ))}
          </div>
        </ChartCard>

      </div>

      {/* Ward comparison table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Ward Comparison</h3>
          <span className="text-xs text-gray-400">Click headers to sort</span>
        </div>
        <WardTable wards={analytics?.wards ?? []} />
      </motion.div>
    </div>
  );
}

export default function AnalyticsPage() {
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
                  className={`nav-item ${item.href === "/admin/analytics" ? "active" : ""}`}>
                  <item.icon className="w-4 h-4 flex-shrink-0" />{item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="flex-1 p-6 overflow-auto">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <h1 className="font-display text-2xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-500 text-sm mt-0.5">All charts powered by live CSV data — no mocks.</p>
            </motion.div>
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-green-600 animate-spin" /></div>}>
              <AnalyticsContent />
            </Suspense>
          </main>
        </div>
      </div>
    </RoleGate>
  );
}
