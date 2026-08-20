"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import {
  ArrowLeft, Upload, CheckCircle2, XCircle,
  Loader2, AlertTriangle, RotateCcw, ShieldCheck,
  Camera, Brain, Clock, MapPin, Zap,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import RoleGate from "@/components/shared/RoleGate";
import { getUser } from "@/lib/auth";
import { issuesApi, resolutionApi } from "@/lib/api";
import { imageUrl, timeAgo } from "@/lib/utils";
import RiskBadge from "@/components/dashboard/RiskBadge";
import toast from "react-hot-toast";
import type { Issue } from "@/types";

type VerifyState = "idle" | "verifying" | "verified" | "failed";

interface VerifyResult {
  verified: boolean;
  score: number;
  reason: string;
  gemini_verify?: any;
  dinov2_visual?: any;
}

export default function ResolveIssuePage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const user    = getUser();

  const [issue,         setIssue]        = useState<Issue | null>(null);
  const [loading,       setLoading]      = useState(true);
  const [afterFile,     setAfterFile]    = useState<File | null>(null);
  const [afterPreview,  setAfterPreview] = useState<string>("");
  const [notes,         setNotes]        = useState("");
  const [verifyState,   setVerifyState]  = useState<VerifyState>("idle");
  const [verifyResult,  setVerifyResult] = useState<VerifyResult | null>(null);
  const [submitting,    setSubmitting]   = useState(false);
  const [startedAt]     = useState(() => new Date().toISOString());
  const [location,      setLocation]     = useState<{latitude: number; longitude: number} | null>(null);

  useEffect(() => {
    issuesApi.get(id)
      .then(r => setIssue(r.issue))
      .catch(() => toast.error("Issue not found"))
      .finally(() => setLoading(false));

    // Pre-grab location while user is reading the page
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => setLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 8000 },
      );
    }
  }, [id]);

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setAfterFile(file);
    setAfterPreview(URL.createObjectURL(file));
    setVerifyState("idle");
    setVerifyResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleVerify = async () => {
    if (!afterFile || !issue || !user) return;
    setVerifyState("verifying");
    try {
      // Submit resolution directly — backend runs DINOv2 + Gemini verification
      const completedAt = new Date().toISOString();
      const timeTaken   = Math.max(0.1,
        (Date.now() - new Date(startedAt).getTime()) / 3600000
      );
      const fd = new FormData();
      fd.append("officer_id",       user.id);
      fd.append("notes",            notes || "Issue repaired and submitted for verification.");
      fd.append("started_at",       startedAt);
      fd.append("completed_at",     completedAt);
      fd.append("time_taken_hours", String(timeTaken));
      if (location) {
        fd.append("latitude",  String(location.latitude));
        fd.append("longitude", String(location.longitude));
      }
      fd.append("after_image", afterFile);

      const result = await resolutionApi.resolve(issue.id, fd);

      const verified = result.verification_status === "verified";
      setVerifyResult({
        verified,
        score:  result.verification_score ?? 0,
        reason: result.verification_reason ?? "",
        gemini_verify: result.gemini_verify,
        dinov2_visual: result.dinov2_visual,
      });
      setVerifyState(verified ? "verified" : "failed");

      if (verified) {
        toast.success("AI verified — issue marked resolved!");
      } else {
        toast("AI verification failed — review result and override if needed.", { icon: "⚠️" });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Verification service error";
      toast.error(msg);
      // Fallback: show result as failed with error message
      setVerifyResult({ verified: false, score: 0, reason: msg });
      setVerifyState("failed");
    }
  };

  const handleOverride = async () => {
    if (!notes.trim()) {
      toast.error("Add a supervisor note to override failed verification.");
      return;
    }
    // Override: force the issue resolved via status update
    try {
      await issuesApi.updateStatus(issue!.id, "resolved", user!.id, `Override by officer: ${notes}`);
      toast.success("Issue marked resolved via override");
      router.push("/worker/dashboard");
    } catch {
      toast.error("Override failed");
    }
  };

  if (loading) return (
    <RoleGate allowedRoles={["worker"]}>
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
      </div>
    </RoleGate>
  );

  const scorePercent = Math.round((verifyResult?.score ?? 0) * 100);

  return (
    <RoleGate allowedRoles={["worker"]}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16 max-w-4xl mx-auto px-4 py-6">

          {/* Back */}
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to issue
          </button>

          {/* Header */}
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-gray-900">Resolution Evidence</h1>
            {issue && (
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="font-mono text-sm text-green-600 font-semibold">{issue.issue_code ?? issue.id}</span>
                <span className="text-gray-400">·</span>
                <span className="text-sm text-gray-600">{issue.title}</span>
                <RiskBadge priority={issue.priority} score={Number(issue.risk_score)} size="sm" />
              </div>
            )}
            {issue && (
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{issue.ward ?? issue.ward_id}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>Reported {timeAgo(issue.created_at)}</span>
                {location && <span className="flex items-center gap-1 text-green-600"><Zap className="w-3 h-3"/>GPS ready</span>}
              </div>
            )}
          </div>

          {/* Before / After split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* Before */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800 text-sm">Before</h2>
                  <p className="text-[10px] text-gray-400">Citizen&apos;s report photo</p>
                </div>
              </div>
              {issue?.image_path ? (
                <div className="rounded-xl overflow-hidden border border-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl(issue.image_path)} alt="Before" className="w-full h-52 object-cover" />
                </div>
              ) : (
                <div className="h-52 bg-gray-50 rounded-xl flex items-center justify-center">
                  <Camera className="w-10 h-10 text-gray-200" />
                </div>
              )}
              {issue && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    ["Category", issue.category?.replace(/_/g, " ")],
                    ["Risk",     `${issue.risk_score}/100`],
                    ["Ward",     issue.ward ?? issue.ward_id ?? "—"],
                    ["Status",   issue.status?.replace(/_/g, " ")],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-gray-50 rounded-lg p-2">
                      <p className="text-[10px] text-gray-400">{k}</p>
                      <p className="text-xs font-semibold text-gray-700 capitalize truncate">{v}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* After */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800 text-sm">After</h2>
                  <p className="text-[10px] text-gray-400">Your repair photo</p>
                </div>
              </div>

              {!afterPreview ? (
                <div {...getRootProps()}
                  className={`h-52 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                    isDragActive ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-green-300 hover:bg-green-50/30"
                  }`}>
                  <input {...getInputProps()} />
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">{isDragActive ? "Drop here" : "Upload repair photo"}</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP · max 10 MB</p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-gray-100 h-52">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={afterPreview} alt="After" className="w-full h-full object-cover" />
                  <button onClick={() => { setAfterFile(null); setAfterPreview(""); setVerifyState("idle"); setVerifyResult(null); }}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  {verifyState === "verified" && (
                    <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-16 h-16 text-green-500 drop-shadow-lg" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Resolution Notes <span className="text-gray-400 font-normal">(required for override)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Describe repair work — materials, method, observations, any issues…"
              rows={3}
              className="input-field resize-none text-sm" />
          </div>

          {/* Verify button */}
          {afterFile && verifyState === "idle" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
              <button onClick={handleVerify}
                className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold text-sm transition-all shadow-md hover:shadow-blue-200">
                <Brain className="w-5 h-5" />
                Run AI Verification (DINOv2 + Gemini)
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">Submits before &amp; after photos to AI for visual similarity check</p>
            </motion.div>
          )}

          {/* Verifying spinner */}
          {verifyState === "verifying" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-5">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                  <Brain className="w-6 h-6 text-blue-600 absolute inset-0 m-auto" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-blue-700">AI Verification in Progress</p>
                  <p className="text-xs text-blue-500 mt-1">DINOv2 visual similarity · Gemini scene analysis · Please wait…</p>
                </div>
                {/* Animated steps */}
                {["Uploading after-repair photo", "DINOv2 embedding comparison", "Gemini scene verification", "Computing final score"].map((step, i) => (
                  <motion.div key={step} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.6 }}
                    className="flex items-center gap-2 text-xs text-blue-600">
                    <Loader2 className="w-3 h-3 animate-spin" />{step}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Result cards */}
          <AnimatePresence>
            {verifyResult && verifyState !== "verifying" && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-5">

                {/* Main result */}
                <div className={`rounded-2xl border-2 p-6 mb-4 ${
                  verifyState === "verified"
                    ? "border-green-300 bg-green-50"
                    : "border-red-300 bg-red-50"
                }`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                      verifyState === "verified" ? "bg-green-500" : "bg-red-500"
                    }`}>
                      {verifyState === "verified"
                        ? <ShieldCheck className="w-7 h-7 text-white" />
                        : <XCircle className="w-7 h-7 text-white" />}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-gray-900">
                        {verifyState === "verified" ? "✅ Verification Passed" : "❌ Verification Failed"}
                      </h3>
                      <p className="text-sm text-gray-600 mt-0.5">
                        AI confidence score: <span className="font-bold text-gray-800">{scorePercent}%</span>
                      </p>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5 text-xs text-gray-500">
                      <span>Verification confidence</span>
                      <span className="font-bold text-gray-700">{scorePercent}%</span>
                    </div>
                    <div className="h-3 bg-white/60 rounded-full overflow-hidden border border-white">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${scorePercent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          scorePercent >= 70 ? "bg-green-500" : scorePercent >= 40 ? "bg-yellow-500" : "bg-red-500"
                        }`} />
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="bg-white/70 rounded-xl p-4 mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5" /> AI Reasoning
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">{verifyResult.reason || "No reasoning provided."}</p>
                  </div>

                  {/* Sub-scores */}
                  {(verifyResult.gemini_verify || verifyResult.dinov2_visual) && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {verifyResult.gemini_verify && (
                        <div className="bg-white/70 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-gray-500 mb-1">Gemini Scene Check</p>
                          <p className="text-xs text-gray-700">{verifyResult.gemini_verify.verified ? "✅ Passed" : "❌ Failed"}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{verifyResult.gemini_verify.reason}</p>
                        </div>
                      )}
                      {verifyResult.dinov2_visual && (
                        <div className="bg-white/70 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-gray-500 mb-1">DINOv2 Visual</p>
                          <p className="text-xs text-gray-700">
                            Similarity: {Math.round((verifyResult.dinov2_visual.visual_similarity ?? 0) * 100)}%
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {verifyResult.dinov2_visual.visually_different ? "✅ Visually different" : "⚠️ Similar to before"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {verifyState === "verified" ? (
                    <button onClick={() => router.push("/worker/dashboard")}
                      className="w-full btn-primary py-3">
                      <CheckCircle2 className="w-4 h-4" /> Done — Back to Dashboard
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button onClick={() => { setVerifyState("idle"); setVerifyResult(null); setAfterFile(null); setAfterPreview(""); }}
                        className="w-full btn-secondary py-3">
                        <RotateCcw className="w-4 h-4" /> Re-upload Better Photo
                      </button>
                      <button onClick={handleOverride}
                        className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-semibold text-sm transition-all">
                        <AlertTriangle className="w-4 h-4" /> Override with Note (requires explanation above)
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </RoleGate>
  );
}
