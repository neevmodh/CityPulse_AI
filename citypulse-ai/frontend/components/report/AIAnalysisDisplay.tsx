"use client";

import { motion } from "framer-motion";
import { Zap, AlertTriangle, Clock, Users } from "lucide-react";
import type { AIAnalysis } from "@/types";

interface AIAnalysisDisplayProps {
  analysis: AIAnalysis;
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50",
  high:     "border-orange-200 bg-orange-50",
  medium:   "border-yellow-200 bg-yellow-50",
  low:      "border-green-200 bg-green-50",
};

const SCORE_COLOR = (score: number) =>
  score >= 80 ? "text-red-600" :
  score >= 60 ? "text-orange-500" :
  score >= 40 ? "text-yellow-600" : "text-green-600";

export default function AIAnalysisDisplay({ analysis }: AIAnalysisDisplayProps) {
  const severity = analysis.gemini_severity ?? "medium";
  const borderBg = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.medium;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border-2 p-5 ${borderBg}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-purple-600" />
        </div>
        <span className="text-sm font-semibold text-gray-800">AI Analysis Result</span>
        <span className="ml-auto text-xs text-gray-400">{analysis.model ?? "Gemini + YOLOv8"}</span>
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-700 mb-4 leading-relaxed">{analysis.gemini_description || analysis.ai_summary}</p>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/70 rounded-xl p-3">
          <div className="text-xs text-gray-500 mb-0.5">Risk Score</div>
          <div className={`text-2xl font-bold ${SCORE_COLOR(Number(analysis.ai_risk_score))}`}>
            {analysis.ai_risk_score}
            <span className="text-sm font-normal text-gray-400">/100</span>
          </div>
        </div>
        <div className="bg-white/70 rounded-xl p-3">
          <div className="text-xs text-gray-500 mb-0.5">Severity</div>
          <div className="text-sm font-bold text-gray-800 capitalize">{severity}</div>
        </div>
        <div className="bg-white/70 rounded-xl p-3">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
            <Clock className="w-3 h-3" />
            Est. Repair
          </div>
          <div className="text-sm font-semibold text-gray-800">
            {analysis.estimated_repair_days ?? "—"} days
          </div>
        </div>
        <div className="bg-white/70 rounded-xl p-3">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
            <Users className="w-3 h-3" />
            Impact
          </div>
          <div className="text-sm font-semibold text-gray-800 capitalize">
            {analysis.affected_population ?? "neighborhood"}
          </div>
        </div>
      </div>

      {/* Recommended action */}
      {analysis.recommended_action && (
        <div className="flex items-start gap-2 bg-white/70 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-0.5">Recommended Action</p>
            <p className="text-xs text-gray-600">{analysis.recommended_action}</p>
          </div>
        </div>
      )}

      {/* YOLO detections */}
      {analysis.yolo_detections && (
        <div className="mt-3 flex flex-wrap gap-2">
          {analysis.yolo_detections.split(",").filter(Boolean).map((det) => (
            <span key={det} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              🔍 {det.replace(/_/g, " ")} ({Math.round(Number(analysis.yolo_confidence) * 100)}%)
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
