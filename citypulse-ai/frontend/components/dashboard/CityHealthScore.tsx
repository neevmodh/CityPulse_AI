"use client";

import { motion } from "framer-motion";
import { healthScoreColor } from "@/lib/utils";

interface CityHealthScoreProps {
  score: number;
  label?: string;
}

export default function CityHealthScore({ score, label = "City Health Score" }: CityHealthScoreProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const color = healthScoreColor(clampedScore);
  const strokeColor =
    clampedScore >= 80 ? "#22c55e" :
    clampedScore >= 60 ? "#eab308" :
    clampedScore >= 40 ? "#f97316" : "#ef4444";

  const radius      = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset  = circumference * (1 - clampedScore / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
          {/* Background track */}
          <circle
            cx="64" cy="64" r={radius}
            fill="none" stroke="#f0fdf4" strokeWidth="10"
          />
          {/* Progress arc */}
          <motion.circle
            cx="64" cy="64" r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`text-3xl font-bold ${color}`}
          >
            {clampedScore}
          </motion.span>
          <span className="text-xs text-gray-400">/100</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-gray-600">{label}</p>
      <p className={`text-xs font-semibold mt-0.5 ${color}`}>
        {clampedScore >= 80 ? "Excellent" :
         clampedScore >= 60 ? "Good" :
         clampedScore >= 40 ? "Needs Attention" : "Critical"}
      </p>
    </div>
  );
}
