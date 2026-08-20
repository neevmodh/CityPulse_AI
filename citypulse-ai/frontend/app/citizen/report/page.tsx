"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Camera, MapPin, Grid3X3, FileText, Brain, Mic, Square,
  CheckCircle2, ChevronRight, ChevronLeft, Loader2,
  AlertTriangle, Zap, Target, BookOpen,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Sidebar from "@/components/shared/Sidebar";
import RoleGate from "@/components/shared/RoleGate";
import ImageUpload from "@/components/report/ImageUpload";
import LocationPicker from "@/components/report/LocationPicker";
import CategorySelect from "@/components/report/CategorySelect";
import AIPipeline from "@/components/report/AIPipeline";
import { getUser } from "@/lib/auth";
import { issuesApi, aiApi } from "@/lib/api";
import toast from "react-hot-toast";
import type { IssueCategory } from "@/types";

const STEPS = [
  { id: 1, label: "Photo",       icon: Camera    },
  { id: 2, label: "Location",    icon: MapPin    },
  { id: 3, label: "Category",    icon: Grid3X3   },
  { id: 4, label: "Description", icon: FileText  },
  { id: 5, label: "AI Review",   icon: Brain     },
];

interface AIResult {
  category: string;
  severity: string;
  risk_score: number;
  summary: string;
  description?: string;
  immediate_action_required?: boolean;
  estimated_repair_days?: number;
  affected_population?: string;
  reasoning?: string[];
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: "text-red-600 bg-red-50 border-red-200",
  high:     "text-orange-600 bg-orange-50 border-orange-200",
  medium:   "text-yellow-700 bg-yellow-50 border-yellow-200",
  low:      "text-green-700 bg-green-50 border-green-200",
};

const RISK_REASONS: Record<string, string[]> = {
  critical: ["School or hospital within 100m", "High-traffic road", "Active rainfall warning", "3+ prior reports at same location"],
  high:     ["Near commercial area", "Moderate traffic volume", "Recent weather event", "Multiple corroborations"],
  medium:   ["Residential zone", "Low pedestrian density", "No weather warning active"],
  low:      ["Low-traffic lane", "Quick fix possible", "No reported injuries"],
};

export default function ReportIssuePage() {
  const router  = useRouter();
  const user    = getUser();

  const [step,        setStep]        = useState(1);
  const [imageFile,   setImageFile]   = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [lat,         setLat]         = useState<number>(23.0225);
  const [lng,         setLng]         = useState<number>(72.5714);
  const [ward,        setWard]        = useState<string>("w01");
  const [category,    setCategory]    = useState<IssueCategory | "">("");
  const [description, setDescription] = useState("");
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState("auto");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const [aiResult,    setAiResult]    = useState<AIResult | null>(null);
  const [analyzing,   setAnalyzing]   = useState(false);
  const [pipelineActive, setPipelineActive] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);

  const handleImageSelected = async (file: File, preview: string) => {
    setImageFile(file);
    setImagePreview(preview);
    setPipelineActive(true);
    setAnalyzing(true);
    try {
      const result = await aiApi.quickAnalyze(file);
      setAiResult(result);
      if (result.category && result.category !== "other") {
        setCategory(result.category as IssueCategory);
      }
    } catch {
      toast.error("AI analysis unavailable — fill in category manually.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLocationSelected = (la: number, lo: number, w?: string) => {
    setLat(la);
    setLng(lo);
    if (w) setWard(w);
  };

  const toggleRecording = async () => {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Voice recording is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      voiceChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) voiceChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(voiceChunksRef.current, { type: "audio/webm" });
        setVoiceFile(new File([blob], "voice-note.webm", { type: "audio/webm" }));
        stream.getTracks().forEach((track) => track.stop());
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      toast.error("Microphone permission was not granted.");
    }
  };

  const canProceed = () => {
    if (step === 1) return !!imageFile;
    if (step === 2) return lat !== 0 && lng !== 0;
    if (step === 3) return category !== "";
    return true;
  };

  const handleSubmit = async () => {
    if (!user || !imageFile) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("description", description || aiResult?.summary || "Reported via CityPulse AI");
      fd.append("category",    category);
      fd.append("ward_id",     ward);
      fd.append("latitude",    lat.toString());
      fd.append("longitude",   lng.toString());
      fd.append("reporter_id",  user.id);
      fd.append("voice_language", voiceLanguage);
      fd.append("voice_transcript", description);
      if (voiceFile) fd.append("audio", voiceFile);
      fd.append("image",       imageFile);

      const res = await issuesApi.create(fd);
      toast.success("Issue reported successfully!");
      router.push(`/citizen/track?issue=${res.issue_id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGate allowedRoles={["citizen"]}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex pt-16">
          <Sidebar role="citizen" />
          <main className="flex-1 p-6 max-w-2xl">

            {/* Header */}
            <div className="mb-6">
              <h1 className="font-display text-2xl font-bold text-gray-900">Report an Issue</h1>
              <p className="text-gray-500 text-sm mt-1">Takes 30 seconds. AI does the rest.</p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-0 mb-8">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                  <button
                    onClick={() => s.id < step && setStep(s.id)}
                    className="flex flex-col items-center gap-1 cursor-default"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      step === s.id   ? "bg-green-600 text-white shadow-md shadow-green-200" :
                      step > s.id     ? "bg-green-100 text-green-700" :
                                        "bg-gray-100 text-gray-400"
                    }`}>
                      {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-[10px] font-medium ${step === s.id ? "text-green-600" : "text-gray-400"}`}>
                      {s.label}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mb-4 mx-1 transition-all ${step > s.id ? "bg-green-300" : "bg-gray-100"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6"
              >
                {/* Step 1 — Photo */}
                {step === 1 && (
                  <div>
                    <h2 className="font-semibold text-gray-900 mb-1">Upload a Photo</h2>
                    <p className="text-sm text-gray-500 mb-4">AI will analyze your photo automatically.</p>
                    <ImageUpload onImageSelected={handleImageSelected} onAIResult={setAiResult} />
                    <AIPipeline
                      key={`${imageFile?.name ?? "image"}-${imageFile?.lastModified ?? 0}`}
                      active={pipelineActive}
                    />

                    {/* Analyzing state */}
                    {analyzing && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="mt-4 flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-700">CityPulse AI is analyzing…</p>
                          <p className="text-xs text-blue-500 mt-0.5">Gemini + YOLOv8 road detection</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Step 2 — Location */}
                {step === 2 && (
                  <div>
                    <h2 className="font-semibold text-gray-900 mb-1">Pin the Location</h2>
                    <p className="text-sm text-gray-500 mb-4">Auto-detects your ward from GPS coordinates.</p>
                    <LocationPicker
                      onLocationSelected={handleLocationSelected}
                      defaultLat={lat} defaultLng={lng}
                    />
                  </div>
                )}

                {/* Step 3 — Category */}
                {step === 3 && (
                  <div>
                    <h2 className="font-semibold text-gray-900 mb-1">
                      {aiResult && category ? "AI Detected Category" : "Select Category"}
                    </h2>
                    {aiResult && category && (
                      <div className="mb-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                        <Zap className="w-3.5 h-3.5" />
                        AI auto-selected <strong className="capitalize">{category.replace(/_/g, " ")}</strong> — confirm or change below
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mb-4">Confirm or override the AI detection.</p>
                    <CategorySelect value={category} onChange={setCategory} />
                  </div>
                )}

                {/* Step 4 — Description */}
                {step === 4 && (
                  <div>
                    <h2 className="font-semibold text-gray-900 mb-1">Add Details <span className="text-gray-400 font-normal">(optional)</span></h2>
                    <p className="text-sm text-gray-500 mb-4">Any extra context for the municipal officer.</p>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                      placeholder="Any extra details? (optional)"
                      rows={4}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400 transition-all"
                    />
                    <div className="text-right text-xs text-gray-400 mt-1">{description.length}/200</div>
                    <div className="mt-5 border-t border-gray-100 pt-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Add a voice note</p>
                          <p className="text-xs text-gray-400">Hindi, English, or Hinglish. Typed notes remain available as fallback.</p>
                        </div>
                        <select value={voiceLanguage} onChange={(event) => setVoiceLanguage(event.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white">
                          <option value="auto">Auto detect</option>
                          <option value="hi">Hindi</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                      <button type="button" onClick={toggleRecording} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${recording ? "bg-red-600 text-white" : "bg-blue-50 text-blue-700 border border-blue-100"}`}>
                        {recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        {recording ? "Stop recording" : voiceFile ? "Record again" : "Record voice note"}
                      </button>
                      {voiceFile && <p className="text-xs text-green-600 mt-2">Voice note attached and will be transcribed with demo fallback if Whisper is unavailable.</p>}
                    </div>
                  </div>
                )}

                {/* Step 5 — AI Review Panel */}
                {step === 5 && (
                  <div>
                    <h2 className="font-semibold text-gray-900 mb-4">AI Analysis</h2>

                    {!aiResult ? (
                      <div className="text-center py-8 text-gray-400">
                        <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No AI analysis available — image may not have been processed.</p>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-2xl border-2 p-5 ${SEVERITY_COLOR[aiResult.severity] ?? "bg-gray-50 border-gray-200"}`}
                      >
                        {/* Robot header */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <Brain className="w-4 h-4 text-purple-600" />
                          </div>
                          <span className="font-semibold text-gray-800 text-sm">CityPulse AI Analysis</span>
                          <span className="ml-auto text-xs font-mono text-gray-400">Gemini + YOLOv8</span>
                        </div>

                        {/* Summary */}
                        <p className="text-sm text-gray-700 mb-4 leading-relaxed">{aiResult.summary}</p>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-white/80 rounded-xl p-3">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                              <CheckCircle2 className="w-3 h-3" /> Detected
                            </div>
                            <div className="font-semibold text-gray-800 capitalize text-sm">
                              {aiResult.category.replace(/_/g, " ")}
                            </div>
                          </div>
                          <div className="bg-white/80 rounded-xl p-3">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                              <Target className="w-3 h-3" /> Risk Score
                            </div>
                            <div className="font-bold text-gray-900 text-xl">
                              {aiResult.risk_score}
                              <span className="text-xs font-normal text-gray-400">/100</span>
                              {" "}
                              <span className={`text-xs font-semibold ${
                                aiResult.risk_score >= 80 ? "text-red-600" :
                                aiResult.risk_score >= 60 ? "text-orange-500" :
                                aiResult.risk_score >= 40 ? "text-yellow-600" : "text-green-600"
                              }`}>
                                → {aiResult.risk_score >= 80 ? "P1 CRITICAL" : aiResult.risk_score >= 60 ? "P2 HIGH" : aiResult.risk_score >= 40 ? "P3 MEDIUM" : "P4 LOW"}
                              </span>
                            </div>
                          </div>
                          <div className="bg-white/80 rounded-xl p-3">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                              <AlertTriangle className="w-3 h-3" /> Severity
                            </div>
                            <div className="font-semibold text-gray-800 text-sm capitalize">{aiResult.severity}</div>
                          </div>
                          <div className="bg-white/80 rounded-xl p-3">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                              <BookOpen className="w-3 h-3" /> Est. Repair
                            </div>
                            <div className="font-semibold text-gray-800 text-sm">
                              {aiResult.estimated_repair_days ?? "—"} days
                            </div>
                          </div>
                        </div>

                        {/* Risk reasoning */}
                        <div className="bg-white/80 rounded-xl p-3 mb-3">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Why this risk level?</p>
                          <ul className="space-y-1.5">
                            {(RISK_REASONS[aiResult.severity] ?? RISK_REASONS.medium).map((reason) => (
                              <li key={reason} className="flex items-start gap-2 text-xs text-gray-600">
                                <span className="w-1.5 h-1.5 bg-current rounded-full mt-1.5 flex-shrink-0" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Recommended action */}
                        <div className="flex items-start gap-2 bg-white/80 rounded-xl p-3">
                          <BookOpen className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-gray-700">Recommended</p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              Inspect and repair within {aiResult.estimated_repair_days ?? 7} hours
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Issue summary before submit */}
                    <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm">
                      <p className="font-medium text-gray-700 mb-2">Your Report Summary</p>
                      <div className="space-y-1 text-xs text-gray-500">
                        <div className="flex gap-2"><span className="w-20 text-gray-400">Category</span><span className="capitalize font-medium text-gray-700">{category.replace(/_/g, " ")}</span></div>
                        <div className="flex gap-2"><span className="w-20 text-gray-400">Location</span><span className="font-mono">{lat.toFixed(4)}, {lng.toFixed(4)} · {ward}</span></div>
                        {description && <div className="flex gap-2"><span className="w-20 text-gray-400">Notes</span><span>{description}</span></div>}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(s => s - 1)}
                disabled={step === 1}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              {step < 5 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !category}
                  className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {submitting ? "Submitting…" : "Submit Report"}
                </button>
              )}
            </div>

          </main>
        </div>
      </div>
    </RoleGate>
  );
}
