"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ChevronDown, ChevronRight, MapPin, Clock,
  CheckCircle2, Circle, Loader2, X, ArrowLeft,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Sidebar from "@/components/shared/Sidebar";
import RoleGate from "@/components/shared/RoleGate";
import RiskBadge from "@/components/dashboard/RiskBadge";
import AIAnalysisDisplay from "@/components/report/AIAnalysisDisplay";
import { getUser } from "@/lib/auth";
import { issuesApi } from "@/lib/api";
import { getStatusColor, timeAgo, formatDate, categoryLabel, imageUrl } from "@/lib/utils";
import type { Issue, AIAnalysis } from "@/types";

// ─── Status pipeline ─────────────────────────────────────────────────────────
const STATUS_PIPELINE = [
  { key: "reported",    label: "Reported"             },
  { key: "ai_analyzed", label: "AI Analyzed"          },
  { key: "verified",    label: "Verified"             },
  { key: "assigned",    label: "Assigned"             },
  { key: "in_progress", label: "In Progress"          },
  { key: "resolved",    label: "Resolved"             },
  { key: "ai_verified", label: "AI Verified"          },
  { key: "closed",      label: "Closed"               },
];

const STATUS_ORDER: Record<string, number> = Object.fromEntries(
  STATUS_PIPELINE.map((s, i) => [s.key, i])
);

const CATEGORY_EMOJI: Record<string, string> = {
  pothole: "🕳️", road_damage: "🚧", footpath: "🚶", streetlight: "💡",
  garbage: "🗑️", sewage: "💧", water_leak: "🚰", electrical_hazard: "⚡",
  tree_hazard: "🌳", park_damage: "🏞️", traffic_signal: "🚦",
  waterlogging: "🌊", manhole: "🕳️", crack: "🚧", drain: "💧",
  fallen_tree: "🌳", other: "📋",
};

// ─── Progress Timeline ────────────────────────────────────────────────────────
function ProgressTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = STATUS_ORDER[currentStatus] ?? 0;
  return (
    <div className="relative">
      {/* Vertical connector line */}
      <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100" />
      <div className="space-y-0">
        {STATUS_PIPELINE.map((s, i) => {
          const done    = i <= currentIdx;
          const current = i === currentIdx;
          const future  = i > currentIdx;
          return (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-4 py-2 relative"
            >
              {/* Step dot */}
              <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                current ? "bg-green-600 shadow-lg shadow-green-200 ring-4 ring-green-100" :
                done    ? "bg-green-100" :
                          "bg-white border-2 border-gray-100"
              }`}>
                {done && !current
                  ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </motion.div>
                  )
                  : current
                  ? <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  : <Circle className="w-4 h-4 text-gray-200" />
                }
              </div>
              {/* Label */}
              <div>
                <span className={`text-sm font-medium ${
                  current ? "text-green-700" : done ? "text-gray-700" : "text-gray-300"
                }`}>
                  {s.label}
                  {current && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                      Current
                    </span>
                  )}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Issue Detail Modal / Panel ───────────────────────────────────────────────
function IssueDetail({
  issue, analysis, history, resolution, voice, onClose,
}: {
  issue: Issue;
  analysis: AIAnalysis | null;
  history: any[];
  resolution?: any;
  voice?: any;
  onClose: () => void;
}) {
  const [showAI, setShowAI] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 32 }}
      className="fixed inset-0 z-40 flex justify-end"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-50 w-full max-w-lg bg-white shadow-2xl h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <span className="font-mono text-xs text-gray-400">{issue.issue_code ?? issue.id}</span>
            <h2 className="font-display font-semibold text-gray-900 text-base leading-tight">{issue.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Image */}
          {issue.image_path && (
            <div className="rounded-xl overflow-hidden border border-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(issue.image_path)} alt={issue.title} className="w-full h-48 object-cover" />
            </div>
          )}

          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            <RiskBadge priority={issue.priority} score={Number(issue.risk_score)} />
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(issue.status)}`}>
              {issue.status.replace("_", " ")}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
              {CATEGORY_EMOJI[issue.category]} {categoryLabel(issue.category)}
            </span>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-0.5">Location</div>
              <div className="flex items-center gap-1 font-medium text-gray-700">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {issue.ward}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-0.5">Reported</div>
              <div className="flex items-center gap-1 font-medium text-gray-700">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {timeAgo(issue.created_at)}
              </div>
            </div>
          </div>

          {/* Status Progress Timeline */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Status Progress</h3>
            <ProgressTimeline currentStatus={issue.status} />
          </div>

          {/* AI Analysis collapsible */}
          {analysis && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowAI(!showAI)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  🤖 AI Analysis
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAI ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {showAI && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4">
                      <AIAnalysisDisplay analysis={analysis} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {voice?.transcript && (
            <div className="border border-blue-100 rounded-xl p-4 bg-blue-50">
              <h3 className="font-semibold text-blue-800 text-sm mb-2">Voice note transcript</h3>
              <p className="text-sm text-blue-900">{voice.transcript}</p>
              <p className="text-xs text-blue-600 mt-2">Language: {voice.transcript_language} · Processing: {voice.processing}</p>
            </div>
          )}

          {/* Resolution evidence */}
          {issue.status === "resolved" && (
            <div className="border border-green-100 rounded-xl p-4 bg-green-50">
              <h3 className="font-semibold text-green-800 text-sm mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Resolution Evidence
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">Before</p>
                  {issue.image_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl(issue.image_path)} alt="before" className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                  ) : <div className="h-24 bg-gray-100 rounded-lg" />}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">After</p>
                  {resolution?.after_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl(resolution.after_image)} alt="after" className="w-full h-24 object-cover rounded-lg border border-green-200" />
                  ) : <div className="h-24 bg-green-100 rounded-lg flex items-center justify-center text-xs text-green-600 font-medium">Resolution photo</div>}
                </div>
              </div>
              {resolution?.verification_status && <p className="text-xs text-green-700 mt-2">AI verification: {resolution.verification_status} · Evidence time: {resolution.time_taken_hours || "—"}h</p>}
              <p className="text-xs text-green-700 mt-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Resolved on {formatDate(issue.resolved_at ?? "")}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Track Page ──────────────────────────────────────────────────────────
function TrackContent() {
  const searchParams   = useSearchParams();
  const focusIssueId   = searchParams.get("issue");
  const user           = getUser();

  const [issues,       setIssues]    = useState<Issue[]>([]);
  const [loading,      setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected,     setSelected]  = useState<{
    issue: Issue; analysis: AIAnalysis | null; history: any[]; resolution?: any; voice?: any;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    issuesApi.getByUser(user.id)
      .then((res) => {
        setIssues(res.issues);
        // Auto-open if ?issue= param provided
        if (focusIssueId) {
          const found = res.issues.find((i: Issue) => i.id === focusIssueId);
          if (found) openDetail(found);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [focusIssueId, user]);

  const openDetail = async (issue: Issue) => {
    setDetailLoading(true);
    try {
      const detail = await issuesApi.get(issue.id);
      setSelected({ issue: detail.issue, analysis: detail.analysis, history: detail.history, resolution: detail.resolution, voice: detail.voice });
    } catch {
      setSelected({ issue, analysis: null, history: [], resolution: null, voice: null });
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <RoleGate allowedRoles={["citizen"]}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex pt-16">
          <Sidebar role="citizen" />
          <main className="flex-1 p-6 max-w-3xl">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-gray-900">My Issues</h1>
                <p className="text-gray-500 text-sm mt-0.5">Track all your reported issues.</p>
              </div>
              <Link
                href="/citizen/report"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                + Report New
              </Link>
            </div>

            {/* Filter summary pills */}
            {!loading && (
              <div className="flex flex-wrap gap-2 mb-5">
                {(["all", "open", "in_progress", "resolved"] as const).map((f) => {
                  const count = f === "all" ? issues.length : issues.filter(i => i.status === f).length;
                  return (
                    <button key={f} onClick={() => setStatusFilter(f)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all border ${
                        statusFilter === f
                          ? "bg-green-600 text-white border-green-600 shadow-sm"
                          : "bg-white border-gray-200 text-gray-600 hover:border-green-300"
                      }`}>
                      {f === "all" ? "All" : f.replace("_", " ")}
                      <span className={`ml-1.5 font-bold ${statusFilter === f ? "text-white/80" : "text-green-600"}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Issue list */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100" />
                ))}
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="text-5xl mb-4">📋</div>
                <p className="font-semibold text-gray-700 mb-1">No issues reported yet</p>
                <p className="text-gray-400 text-sm mb-4">Start by reporting a civic issue in your area.</p>
                <Link href="/citizen/report" className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
                  Report an Issue <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {issues
                  .filter(i => statusFilter === "all" || i.status === statusFilter)
                  .map((issue, i) => {
                  const currentIdx = STATUS_ORDER[issue.status] ?? 0;
                  const totalSteps = STATUS_PIPELINE.length - 1;
                  const progress   = Math.round((currentIdx / totalSteps) * 100);

                  return (
                    <motion.div
                      key={issue.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => openDetail(issue)}
                      className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-green-200 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex gap-3">
                        {/* Thumbnail */}
                        <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                          {issue.image_path ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imageUrl(issue.image_path)} alt="" className="w-full h-full object-cover" />
                          ) : (CATEGORY_EMOJI[issue.category] ?? "📋")}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Top row */}
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div>
                              <span className="font-mono text-xs text-gray-400 mr-2">{issue.issue_code ?? issue.id}</span>
                              <RiskBadge priority={issue.priority} score={Number(issue.risk_score)} size="sm" />
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-500 flex-shrink-0 transition-colors" />
                          </div>

                          <p className="text-sm font-semibold text-gray-800 mb-2 truncate">{issue.title}</p>

                          {/* Status progress bar */}
                          <div className="mb-2">
                            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                              <span className="capitalize">{issue.status.replace("_", " ")}</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ delay: i * 0.05 + 0.3, duration: 0.6 }}
                                className={`h-full rounded-full ${
                                  issue.status === "resolved" || issue.status === "closed" ? "bg-green-500" :
                                  issue.status === "in_progress" ? "bg-blue-500" :
                                  "bg-yellow-400"
                                }`}
                              />
                            </div>
                          </div>

                          {/* Meta */}
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{issue.ward}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(issue.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </main>
        </div>

        {/* Detail panel */}
        {detailLoading && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/10">
            <div className="bg-white rounded-2xl p-6 shadow-xl flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
              <span className="text-sm font-medium text-gray-700">Loading details…</span>
            </div>
          </div>
        )}

        <AnimatePresence>
          {selected && (
            <IssueDetail
              issue={selected.issue}
              analysis={selected.analysis}
              history={selected.history}
              resolution={selected.resolution}
              voice={selected.voice}
              onClose={() => setSelected(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </RoleGate>
  );
}

export default function TrackIssuePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}
