"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Activity, BarChart2, Map as MapIcon, Layers, Users,
  Search, Filter, X, ChevronDown, ArrowRight, Download,
  RefreshCw, CheckSquare, Square, AlertTriangle, CheckCircle2,
  Clock, Loader2, MapPin,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import RoleGate from "@/components/shared/RoleGate";
import RiskBadge from "@/components/dashboard/RiskBadge";
import { issuesApi, assignmentsApi, workersApi } from "@/lib/api";
import { getStatusColor, timeAgo, categoryLabel } from "@/lib/utils";
import type { Issue, Worker, Department } from "@/types";
import toast from "react-hot-toast";

const ADMIN_NAV = [
  { label: "Overview",  href: "/admin/dashboard",  icon: Activity  },
  { label: "Issues",    href: "/admin/issues",      icon: Layers    },
  { label: "Hotspots",  href: "/admin/hotspots",    icon: MapIcon   },
  { label: "Analytics", href: "/admin/analytics",   icon: BarChart2 },
  { label: "Workers",   href: "/admin/workers",     icon: Users     },
];

const STATUSES = ["all","open","ai_analyzed","assigned","in_progress","resolved","reopened","closed"];
const PRIORITIES = ["all","critical","high","medium","low"];
const CATEGORIES = ["all","pothole","road_damage","garbage","sewage","streetlight","waterlogging","electrical_hazard","footpath","park_damage","tree_hazard","traffic_signal","other"];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  open:        <AlertTriangle className="w-3 h-3" />,
  in_progress: <Clock className="w-3 h-3" />,
  resolved:    <CheckCircle2 className="w-3 h-3" />,
};

/* ── Bulk Assign Modal ───────────────────────────────────────────────────── */
function BulkAssignModal({
  issueIds, workers, departments, onDone, onClose,
}: {
  issueIds: string[]; workers: Worker[]; departments: Department[];
  onDone: () => void; onClose: () => void;
}) {
  const [workerId,   setWorkerId]   = useState(workers[0]?.id ?? "");
  const [deptId,     setDeptId]     = useState(departments[0]?.id ?? "");
  const [notes,      setNotes]      = useState("");
  const [assigning,  setAssigning]  = useState(false);

  const assign = async () => {
    setAssigning(true);
    let ok = 0, fail = 0;
    for (const id of issueIds) {
      try {
        await assignmentsApi.assign({ issue_id: id, officer_id: workerId, department_id: deptId, notes });
        ok++;
      } catch { fail++; }
    }
    if (ok) toast.success(`${ok} issue${ok > 1 ? "s" : ""} assigned`);
    if (fail) toast.error(`${fail} failed`);
    setAssigning(false);
    onDone();
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-gray-900">Bulk Assign {issueIds.length} Issues</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Assign to Officer</label>
            <select value={workerId} onChange={e => setWorkerId(e.target.value)} className="input-field">
              {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Department</label>
            <select value={deptId} onChange={e => setDeptId(e.target.value)} className="input-field">
              {departments.map(d => <option key={d.id} value={d.id}>{d.name} · {d.sla_hours}h SLA</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="input-field resize-none" placeholder="e.g. Urgent — monsoon damage" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
          <button onClick={assign} disabled={assigning || !workerId || !deptId}
            className="btn-primary flex-1 py-2.5">
            {assigning ? <><Loader2 className="w-4 h-4 animate-spin" /> Assigning…</> : "Confirm Assignment"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminIssuesPage() {
  const [issues,      setIssues]      = useState<Issue[]>([]);
  const [workers,     setWorkers]     = useState<Worker[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [total,       setTotal]       = useState(0);

  /* filters */
  const [search,    setSearch]    = useState("");
  const [status,    setStatus]    = useState("all");
  const [priority,  setPriority]  = useState("all");
  const [category,  setCategory]  = useState("all");
  const [page,      setPage]      = useState(0);
  const PAGE_SIZE = 50;

  /* selection */
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBulk, setShowBulk] = useState(false);

  const load = useCallback(async (reset = false) => {
    setRefreshing(true);
    const offset = reset ? 0 : page * PAGE_SIZE;
    if (reset) setPage(0);
    try {
      const [issueRes, wRes, dRes] = await Promise.all([
        issuesApi.list({
          status:    status   !== "all" ? status   : undefined,
          priority:  priority !== "all" ? priority : undefined,
          category:  category !== "all" ? category : undefined,
          limit: PAGE_SIZE, offset,
        }),
        workersApi.list(),
        workersApi.departments(),
      ]);
      setIssues(issueRes.issues);
      setTotal(issueRes.total);
      setWorkers(wRes.workers);
      setDepartments(dRes.departments);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [status, priority, category, page]);

  useEffect(() => { load(true); }, [status, priority, category]);
  useEffect(() => { if (!loading) load(); }, [page]);

  const filtered = issues.filter(i =>
    !search || i.title?.toLowerCase().includes(search.toLowerCase())
      || i.issue_code?.toLowerCase().includes(search.toLowerCase())
      || i.category?.toLowerCase().includes(search.toLowerCase())
      || (i.ward ?? i.ward_id ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(filtered.map(i => i.id)));
  const clearAll  = () => setSelected(new Set());

  const exportCSV = () => {
    const rows = [
      ["ID","Code","Category","Status","Priority","Risk","Ward","Created"],
      ...filtered.map(i => [i.id, i.issue_code ?? "", i.category, i.status, i.priority, i.risk_score, i.ward ?? i.ward_id ?? "", i.created_at]),
    ];
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "issues.csv"; a.click();
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await issuesApi.updateStatus(id, newStatus, "admin");
      setIssues(prev => prev.map(i => i.id === id ? { ...i, status: newStatus as any } : i));
      toast.success(`Status updated to ${newStatus}`);
    } catch { toast.error("Update failed"); }
  };

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
                  className={`nav-item ${item.href === "/admin/issues" ? "active" : ""}`}>
                  <item.icon className="w-4 h-4 flex-shrink-0" />{item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <main className="flex-1 p-6 overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-gray-900">All Issues</h1>
                <p className="text-gray-500 text-sm mt-0.5">{total} total · {filtered.length} shown</p>
              </div>
              <div className="flex items-center gap-2">
                {selected.size > 0 && (
                  <button onClick={() => setShowBulk(true)}
                    className="flex items-center gap-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl transition-all">
                    Assign {selected.size} selected
                  </button>
                )}
                <button onClick={exportCSV}
                  className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-xl hover:bg-green-100 font-medium">
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
                <button onClick={() => load(true)} disabled={refreshing}
                  className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-48">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search title, code, category, ward…"
                    className="input-field pl-9 py-2 text-sm" />
                </div>
                {[
                  { label: "Status",   options: STATUSES,    val: status,   set: setStatus   },
                  { label: "Priority", options: PRIORITIES,  val: priority, set: setPriority },
                  { label: "Category", options: CATEGORIES,  val: category, set: setCategory },
                ].map(f => (
                  <div key={f.label} className="relative">
                    <select value={f.val} onChange={e => f.set(e.target.value)}
                      className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-green-400 focus:outline-none pr-7 appearance-none cursor-pointer">
                      {f.options.map(o => <option key={o} value={o}>{o === "all" ? `All ${f.label}s` : o}</option>)}
                    </select>
                    <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                ))}
                {(status !== "all" || priority !== "all" || category !== "all" || search) && (
                  <button onClick={() => { setStatus("all"); setPriority("all"); setCategory("all"); setSearch(""); }}
                    className="text-xs text-orange-600 hover:underline flex items-center gap-1 font-medium">
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              {/* Select all bar */}
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
                <button onClick={selected.size === filtered.length ? clearAll : selectAll}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-green-600 font-medium transition-colors">
                  {selected.size === filtered.length && filtered.length > 0
                    ? <CheckSquare className="w-4 h-4 text-green-600" />
                    : <Square className="w-4 h-4" />}
                  {selected.size === filtered.length && filtered.length > 0 ? "Deselect all" : "Select all"}
                </button>
                {selected.size > 0 && (
                  <span className="text-xs text-green-600 font-semibold">{selected.size} selected</span>
                )}
              </div>
            </div>

            {/* Issue table */}
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-14 bg-white rounded-xl skeleton" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                <Filter className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                <p className="text-gray-500 font-medium">No issues match your filters</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting the status, priority, or category</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[32px_1fr_100px_90px_80px_90px_100px_100px] gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <div />
                  <div>Issue</div>
                  <div>Category</div>
                  <div>Priority</div>
                  <div>Risk</div>
                  <div>Status</div>
                  <div>Ward</div>
                  <div>Actions</div>
                </div>
                <div className="divide-y divide-gray-50">
                  {filtered.map((issue, i) => (
                    <motion.div key={issue.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                      className={`grid grid-cols-[32px_1fr_100px_90px_80px_90px_100px_100px] gap-3 px-4 py-3 hover:bg-green-50/30 transition-colors items-center ${selected.has(issue.id) ? "bg-green-50" : ""}`}>
                      <button onClick={() => toggleSelect(issue.id)} className="flex items-center justify-center">
                        {selected.has(issue.id)
                          ? <CheckSquare className="w-4 h-4 text-green-600" />
                          : <Square className="w-4 h-4 text-gray-300 hover:text-gray-500" />}
                      </button>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{issue.title}</p>
                        <span className="font-mono text-[10px] text-gray-400">{issue.issue_code ?? issue.id}</span>
                      </div>
                      <div className="text-xs text-gray-600 capitalize truncate">{categoryLabel(issue.category)}</div>
                      <div><RiskBadge priority={issue.priority} size="sm" /></div>
                      <div className="font-mono text-sm font-bold text-gray-700">{issue.risk_score}</div>
                      <div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(issue.status)}`}>
                          {issue.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {issue.ward ?? issue.ward_id}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Link href={`/worker/issues/${issue.id}`}
                          className="text-xs text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-lg font-semibold transition-all">
                          View
                        </Link>
                        {issue.status !== "resolved" && issue.status !== "closed" && (
                          <select onChange={e => e.target.value && updateStatus(issue.id, e.target.value)}
                            defaultValue=""
                            className="text-xs border border-gray-200 rounded-lg px-1.5 py-1 bg-white hover:border-green-300 focus:outline-none">
                            <option value="" disabled>Status…</option>
                            {["open","assigned","in_progress","resolved","closed"].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
                  <span className="text-xs text-gray-500">
                    Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 transition-all">
                      Previous
                    </button>
                    <span className="text-xs text-gray-600 font-medium">Page {page + 1}</span>
                    <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= total}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 transition-all">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Bulk assign modal */}
        <AnimatePresence>
          {showBulk && (
            <BulkAssignModal
              issueIds={Array.from(selected)} workers={workers} departments={departments}
              onDone={() => { clearAll(); load(true); }} onClose={() => setShowBulk(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </RoleGate>
  );
}
