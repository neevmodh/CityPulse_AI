"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft, MapPin, Clock, AlertTriangle, Brain,
  BarChart2, History, Eye, Play, Upload, RefreshCw,
  CheckCircle2, Loader2, Zap, User,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import RoleGate from "@/components/shared/RoleGate";
import RiskBadge from "@/components/dashboard/RiskBadge";
import StatusTimeline from "@/components/dashboard/StatusTimeline";
import { getUser } from "@/lib/auth";
import { issuesApi, riskApi, assignmentsApi } from "@/lib/api";
import { getStatusColor, formatDate, categoryLabel, imageUrl } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Issue, AIAnalysis } from "@/types";

const IssueMap = dynamic(() => import("@/components/maps/IssueMap"), { ssr: false });

const TABS = [
  { id: "overview",  label: "Overview",      icon: Eye       },
  { id: "ai",        label: "AI Analysis",   icon: Brain     },
  { id: "risk",      label: "Risk Breakdown",icon: BarChart2  },
  { id: "timeline",  label: "Timeline",      icon: History   },
];

// ─── Risk gauge ───────────────────────────────────────────────────────────────
function RiskGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const color =
    clamped >= 80 ? "#dc2626" :
    clamped >= 60 ? "#f97316" :
    clamped >= 40 ? "#eab308" : "#16a34a";
  const r = 54, circ = 2 * Math.PI * r;
  const offset = circ * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
          <circle cx="64" cy="64" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
          <motion.circle
            cx="64" cy="64" r={r}
            fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-3xl font-bold" style={{ color }}
          >
            {clamped}
          </motion.span>
          <span className="text-xs text-gray-400">/100</span>
        </div>
      </div>
    </div>
  );
}

// ─── Factor bar ───────────────────────────────────────────────────────────────
function FactorBar({ label, value, max, color = "bg-green-500" }: {
  label: string; value: number; max: number; color?: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-36 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="font-mono text-xs text-gray-500 w-12 text-right">{value}/{max}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function IssueDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const user     = getUser();

  const [tab,       setTab]      = useState("overview");
  const [issue,     setIssue]    = useState<Issue | null>(null);
  const [analysis,  setAnalysis] = useState<AIAnalysis | null>(null);
  const [history,   setHistory]  = useState<any[]>([]);
  const [riskScore, setRiskScore] = useState<any>(null);
  const [loading,   setLoading]  = useState(true);
  const [updating,  setUpdating] = useState(false);

  useEffect(() => {
    issuesApi.get(id)
      .then((res) => {
        setIssue(res.issue);
        setAnalysis(res.analysis);
        setHistory(res.history ?? []);
      })
      .catch(() => toast.error("Issue not found"))
      .finally(() => setLoading(false));

    riskApi.getScore(id).then(setRiskScore).catch(() => {});
  }, [id]);

  const handleStartWork = async () => {
    if (!user || !issue) return;
    setUpdating(true);
    try {
      await issuesApi.updateStatus(id, "in_progress", user.id);
      setIssue(prev => prev ? { ...prev, status: "in_progress" } : prev);
      toast.success("Status updated to In Progress");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <RoleGate allowedRoles={["worker", "admin"]}>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
      </div>
    </RoleGate>
  );

  if (!issue) return (
    <RoleGate allowedRoles={["worker", "admin"]}>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Issue not found.
      </div>
    </RoleGate>
  );

  const riskFactors = riskScore ? [
    { label: "Severity",         value: Number(riskScore.severity_score  ?? 0), max: 30, color: "bg-red-500"    },
    { label: "Traffic Exposure", value: Number(riskScore.exposure_score  ?? 0), max: 20, color: "bg-orange-500" },
    { label: "Location",         value: Number(riskScore.location_score  ?? 0), max: 20, color: "bg-yellow-500" },
    { label: "Recurrence",       value: Number(riskScore.recurrence_score?? 0), max: 15, color: "bg-blue-500"   },
    { label: "Weather",          value: Number(riskScore.weather_score   ?? 0), max: 10, color: "bg-cyan-500"   },
    { label: "Frequency",        value: Number(riskScore.frequency_score ?? 0), max: 5,  color: "bg-purple-500" },
  ] : [];

  return (
    <RoleGate allowedRoles={["worker", "admin"]}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 pt-16 max-w-4xl mx-auto w-full px-4 py-6 pb-32">

          {/* Back */}
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to queue
          </button>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-mono text-sm font-bold text-gray-400">{issue.issue_code ?? issue.id}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-sm text-gray-600 capitalize">{categoryLabel(issue.category)}</span>
                  <RiskBadge priority={issue.priority} score={Number(issue.risk_score)} />
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(issue.status)}`}>
                    {issue.status.replace("_", " ")}
                  </span>
                </div>
                <h1 className="font-display text-xl font-bold text-gray-900">{issue.title}</h1>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{issue.ward}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDate(issue.created_at)}</span>
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />Citizen #{issue.reported_by?.slice(-3)?.toUpperCase()}</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 font-mono">{issue.risk_score}</div>
                <div className="text-xs text-gray-400">Risk Score</div>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-4 shadow-sm">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  tab === t.id
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
            >
              {/* ── Overview ── */}
              {tab === "overview" && (
                <div className="space-y-6">
                  {/* Photo */}
                  {issue.image_path && (
                    <div className="rounded-xl overflow-hidden border border-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl(issue.image_path)} alt={issue.title} className="w-full max-h-64 object-cover" />
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-2">Description</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{issue.description}</p>
                  </div>

                  {/* Mini map */}
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-2">Location</h3>
                    <div className="rounded-xl overflow-hidden border border-gray-100 h-48">
                      <IssueMap
                        issues={[issue]}
                        height="192px"
                        center={[Number(issue.latitude), Number(issue.longitude)]}
                        zoom={15}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {Number(issue.latitude).toFixed(5)}, {Number(issue.longitude).toFixed(5)} · {issue.ward}
                    </p>
                  </div>

                  {/* Reporter (anonymised) */}
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Citizen #{issue.reported_by?.slice(-3)?.toUpperCase()}</p>
                      <p className="text-xs text-gray-400">{issue.ward} · Reported {formatDate(issue.created_at)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── AI Analysis ── */}
              {tab === "ai" && (
                <div className="space-y-5">
                  {!analysis ? (
                    <div className="text-center py-10 text-gray-400">
                      <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No AI analysis available for this issue.</p>
                    </div>
                  ) : (
                    <>
                      {/* Detection badge */}
                      <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                        <Zap className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-semibold text-blue-800">
                            {analysis.model ?? "Gemini 1.5 Flash + YOLOv8"}
                          </p>
                          <p className="text-xs text-blue-500">
                            {analysis.category} · {Math.round(Number(analysis.yolo_confidence ?? analysis.confidence ?? 0.94) * 100)}% confidence
                          </p>
                        </div>
                        <div className="ml-auto text-right">
                          <div className="text-lg font-bold text-blue-700 font-mono">{Math.round(Number(analysis.yolo_confidence ?? 0.94) * 100)}%</div>
                          <div className="text-xs text-blue-400">Confidence</div>
                        </div>
                      </div>

                      {/* Gemini reasoning */}
                      <div className="border border-gray-100 rounded-xl p-4">
                        <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                          <Brain className="w-4 h-4 text-purple-500" />
                          Gemini AI Reasoning
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed italic">
                          &quot;{analysis.gemini_description || analysis.summary}&quot;
                        </p>
                      </div>

                      {/* Recommended action */}
                      {(analysis.recommended_action || analysis.reasoning) && (
                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-orange-700 mb-1">Recommended Action</p>
                              <p className="text-sm text-orange-800">
                                {analysis.recommended_action ?? analysis.reasoning}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* YOLO detections */}
                      {analysis.yolo_detections && (
                        <div>
                          <h3 className="font-semibold text-gray-800 text-sm mb-2">YOLO Road Detections</h3>
                          <div className="flex flex-wrap gap-2">
                            {String(analysis.yolo_detections).split(",").filter(Boolean).map(d => (
                              <span key={d} className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full font-medium">
                                🔍 {d.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── Risk Breakdown ── */}
              {tab === "risk" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center gap-8">
                    <RiskGauge score={Number(issue.risk_score)} />
                    <div className="flex-1 w-full">
                      <h3 className="font-semibold text-gray-800 text-sm mb-4">Factor Breakdown</h3>
                      <div className="space-y-3">
                        {riskFactors.length > 0 ? riskFactors.map(f => (
                          <FactorBar key={f.label} {...f} />
                        )) : (
                          // Fallback estimated bars based on risk score
                          [
                            { label: "Severity",         value: Math.round(Number(issue.risk_score) * 0.32), max: 30, color: "bg-red-500"    },
                            { label: "Traffic Exposure", value: Math.round(Number(issue.risk_score) * 0.19), max: 20, color: "bg-orange-500" },
                            { label: "Location",         value: Math.round(Number(issue.risk_score) * 0.21), max: 20, color: "bg-yellow-500" },
                            { label: "Recurrence",       value: Math.round(Number(issue.risk_score) * 0.14), max: 15, color: "bg-blue-500"   },
                            { label: "Weather",          value: Math.round(Number(issue.risk_score) * 0.09), max: 10, color: "bg-cyan-500"   },
                            { label: "Frequency",        value: Math.round(Number(issue.risk_score) * 0.05), max: 5,  color: "bg-purple-500" },
                          ].map(f => <FactorBar key={f.label} {...f} />)
                        )}
                        <div className="border-t border-gray-100 pt-3 flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-700 w-36">TOTAL</span>
                          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Number(issue.risk_score)}%` }}
                              transition={{ duration: 1.2 }}
                              className={`h-full rounded-full ${
                                Number(issue.risk_score) >= 80 ? "bg-red-500" :
                                Number(issue.risk_score) >= 60 ? "bg-orange-500" :
                                Number(issue.risk_score) >= 40 ? "bg-yellow-500" : "bg-green-500"
                              }`}
                            />
                          </div>
                          <span className="font-mono text-sm font-bold text-gray-700 w-12 text-right">
                            {issue.risk_score}/100
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reasoning text */}
                  {riskScore?.reasoning && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-xs font-semibold text-gray-600 mb-1.5">Risk Reasoning</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{riskScore.reasoning}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Timeline ── */}
              {tab === "timeline" && (
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-4">Issue History</h3>
                  {history.length > 0 ? (
                    <StatusTimeline history={history} />
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">No history entries yet.</div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Sticky Action Bar ── */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg px-4 py-3 z-40">
          <div className="max-w-4xl mx-auto flex items-center gap-3 flex-wrap">
            {issue.status === "open" || issue.status === "assigned" ? (
              <button
                onClick={handleStartWork}
                disabled={updating}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Start Work
              </button>
            ) : null}

            {issue.status === "in_progress" && (
              <Link
                href={`/worker/resolve/${issue.id}`}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                <Upload className="w-4 h-4" />
                Upload Resolution Evidence
              </Link>
            )}

            {issue.status === "resolved" && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-5 py-2.5 rounded-xl text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Issue Resolved
              </div>
            )}

            <button
              onClick={async () => {
                if (!user) return;
                try {
                  await issuesApi.updateStatus(id, "open", user.id);
                  toast.success("Reassignment requested");
                } catch { toast.error("Failed"); }
              }}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Request Reassignment
            </button>

            <div className="ml-auto text-xs text-gray-400 hidden sm:block">
              Issue {issue.issue_code ?? issue.id} · {issue.ward}
            </div>
          </div>
        </div>
      </div>
    </RoleGate>
  );
}
